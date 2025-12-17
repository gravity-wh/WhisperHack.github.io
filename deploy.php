<?php
declare(strict_types=1);

set_time_limit(0);
ini_set('display_errors', '0');

const GITHUB_SECRET = 'Wh190125';
const EXPECTED_REF = 'refs/heads/main';
const LOG_FILE = __DIR__ . '/deploy.log';
const REPO_DIR = __DIR__;

function logMessage(string $message): void
{
	file_put_contents(LOG_FILE, '[' . date('c') . '] ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function sendResponse(int $statusCode, array $payload): never
{
	http_response_code($statusCode);
	header('Content-Type: application/json');
	echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
	exit;
}

function runCommand(string $command): array
{
	$descriptor = [
		['pipe', 'r'],
		['pipe', 'w'],
		['pipe', 'w'],
	];

	$process = proc_open($command, $descriptor, $pipes, REPO_DIR);
	if (!is_resource($process)) {
		return [1, ['failed to start ' . $command]];
	}

	fclose($pipes[0]);
	$stdout = stream_get_contents($pipes[1]);
	fclose($pipes[1]);
	$stderr = stream_get_contents($pipes[2]);
	fclose($pipes[2]);

	$exitCode = proc_close($process);
	$output = array_filter(array_map('trim', explode(PHP_EOL, $stdout . PHP_EOL . $stderr)));

	return [$exitCode, $output];
}

$payload = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? '';
$event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? 'unknown';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	sendResponse(405, ['status' => 'error', 'reason' => 'Only POST is allowed']);
}

if ($payload === '') {
	sendResponse(400, ['status' => 'error', 'reason' => 'Empty payload']);
}

if ($signature === '') {
	sendResponse(403, ['status' => 'error', 'reason' => 'Missing signature']);
}

$algo = str_contains($signature, 'sha256=') ? 'sha256' : 'sha1';
$expected = $algo . '=' . hash_hmac($algo, $payload, GITHUB_SECRET);
if (!hash_equals($expected, $signature)) {
	logMessage('Signature mismatch for event ' . $event);
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

$commands = [
	'git fetch origin main --tags --force',
	'git reset --hard origin/main',
	'git clean -fd',
];

$results = [];
$failed = false;

foreach ($commands as $command) {
	[$exitCode, $output] = runCommand($command);
	$results[] = ['command' => $command, 'exit' => $exitCode, 'output' => $output];

	if ($exitCode !== 0) {
		$failed = true;
		logMessage('Command failed: ' . $command . ' | exit=' . $exitCode);
		break;
	}
}

if ($failed) {
	sendResponse(500, ['status' => 'error', 'results' => $results]);
}

logMessage('Deployment completed from ' . ($data['head_commit']['id'] ?? 'unknown commit'));
sendResponse(200, ['status' => 'success', 'results' => $results]);
