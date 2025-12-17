<?php
declare(strict_types=1);

set_time_limit(0);
ini_set('display_errors', '0');

const GITHUB_SECRET = 'Wh190125';
const EXPECTED_REF = 'refs/heads/main';
const LOG_FILE = __DIR__ . '/deploy.log';
const REPO_DIR = __DIR__;
const LOCK_FILE = __DIR__ . '/deploy.lock';

function logMessage(string $message): void
{
	file_put_contents(LOG_FILE, '[' . date('c') . '] ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function sendResponse(int $statusCode, array $payload): void
{
	http_response_code($statusCode);
	header('Content-Type: application/json');
	echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
	exit;
}

function getWebhookSecret(): string
{
	$envSecret = getenv('GITHUB_WEBHOOK_SECRET');
	if (is_string($envSecret) && $envSecret !== '') {
		return $envSecret;
	}
	return GITHUB_SECRET;
}

function normalizeSignature(string $signature): array
{
	$signature = trim($signature);
	if ($signature === '') {
		return ['', ''];
	}
	if (!preg_match('/^(sha1|sha256)=([0-9a-f]{40}|[0-9a-f]{64})$/i', $signature, $matches)) {
		return ['', ''];
	}
	return [strtolower($matches[1]), strtolower($matches[2])];
}

function runCommand(string $command, array $env = []): array
{
	$descriptor = [
		['pipe', 'r'],
		['pipe', 'w'],
		['pipe', 'w'],
	];

	$baseEnv = array_merge($_ENV, [
		'GIT_TERMINAL_PROMPT' => '0',
		'GIT_ASKPASS' => 'echo',
	], $env);

	// Windows/IIS often needs an explicit shell.
	if (DIRECTORY_SEPARATOR === '\\') {
		$command = 'cmd /d /s /c ' . escapeshellarg($command);
	} else {
		$command = '/bin/sh -lc ' . escapeshellarg($command);
	}

	$process = proc_open($command, $descriptor, $pipes, REPO_DIR, $baseEnv);
	if (!is_resource($process)) {
		return [1, ['failed to start command']];
	}

	fclose($pipes[0]);
	$stdout = stream_get_contents($pipes[1]);
	fclose($pipes[1]);
	$stderr = stream_get_contents($pipes[2]);
	fclose($pipes[2]);

	$exitCode = proc_close($process);
	$output = array_filter(array_map('trim', preg_split('/\R/', $stdout . "\n" . $stderr) ?: []));

	return [$exitCode, array_values($output)];
}

$payload = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? '';
$event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? 'unknown';
$delivery = $_SERVER['HTTP_X_GITHUB_DELIVERY'] ?? 'unknown';

if (!function_exists('proc_open')) {
	logMessage('proc_open is disabled | event=' . $event . ' | delivery=' . $delivery);
	sendResponse(500, ['status' => 'error', 'reason' => 'Server does not allow executing commands (proc_open disabled)']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	sendResponse(200, ['status' => 'ok', 'message' => 'deploy endpoint alive']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	sendResponse(405, ['status' => 'error', 'reason' => 'Only POST is allowed']);
}

if ($payload === '') {
	sendResponse(400, ['status' => 'error', 'reason' => 'Empty payload']);
}

if ($signature === '') {
	sendResponse(403, ['status' => 'error', 'reason' => 'Missing signature']);
}


[$algo, $sigHash] = normalizeSignature($signature);
if ($algo === '' || $sigHash === '') {
	logMessage('Invalid signature format | event=' . $event . ' | delivery=' . $delivery);
	sendResponse(403, ['status' => 'error', 'reason' => 'Invalid signature format']);
}

$secret = getWebhookSecret();
$expectedHash = hash_hmac($algo, $payload, $secret);
if (!hash_equals($expectedHash, $sigHash)) {
	logMessage('Signature mismatch | event=' . $event . ' | delivery=' . $delivery);
	sendResponse(403, ['status' => 'error', 'reason' => 'Invalid signature']);
}

if ($event !== 'push') {
	sendResponse(202, ['status' => 'ignored', 'reason' => 'Only push events are handled']);
}

$data = json_decode($payload, true);
if (!is_array($data)) {
	sendResponse(400, ['status' => 'error', 'reason' => 'Invalid payload']);
}

if (($data['ref'] ?? null) !== EXPECTED_REF) {
	sendResponse(202, ['status' => 'ignored', 'reason' => 'Not the main branch']);
}

$lockHandle = fopen(LOCK_FILE, 'c');
if ($lockHandle === false) {
	sendResponse(500, ['status' => 'error', 'reason' => 'Unable to open lock file']);
}

if (!flock($lockHandle, LOCK_EX | LOCK_NB)) {
	sendResponse(429, ['status' => 'busy', 'reason' => 'Deployment already running']);
}

$git = getenv('GIT_BINARY');
if (!is_string($git) || $git === '') {
	$git = 'git';
}

if ($git === 'git' && DIRECTORY_SEPARATOR === '\\') {
	$candidates = [
		'\\Program Files\\Git\\cmd\\git.exe',
		'\\Program Files\\Git\\bin\\git.exe',
		'\\Program Files (x86)\\Git\\cmd\\git.exe',
		'\\Program Files (x86)\\Git\\bin\\git.exe',
	];
	foreach ($candidates as $suffix) {
		$path = getenv('SystemDrive') . $suffix;
		if (is_string($path) && $path !== '' && is_file($path)) {
			$git = '"' . $path . '"';
			break;
		}
	}
}

$safe = '-c safe.directory=' . escapeshellarg(REPO_DIR);

$commands = [
	$git . ' ' . $safe . ' fetch --prune --tags --force origin main',
	$git . ' ' . $safe . ' reset --hard origin/main',
	$git . ' ' . $safe . ' clean -fdx',
];

$results = [];
$failed = false;

foreach ($commands as $command) {
	[$exitCode, $output] = runCommand($command);
	$results[] = ['command' => $command, 'exit' => $exitCode, 'output' => $output];

	if ($exitCode !== 0) {
		$failed = true;
		logMessage('Command failed | event=' . $event . ' | delivery=' . $delivery . ' | cmd=' . $command . ' | exit=' . $exitCode);
		break;
	}
}

if ($failed) {
	flock($lockHandle, LOCK_UN);
	fclose($lockHandle);
	sendResponse(500, ['status' => 'error', 'results' => $results]);
}

logMessage('Deployment completed | delivery=' . $delivery . ' | commit=' . ($data['head_commit']['id'] ?? 'unknown commit'));

flock($lockHandle, LOCK_UN);
fclose($lockHandle);
sendResponse(200, ['status' => 'success', 'results' => $results]);
