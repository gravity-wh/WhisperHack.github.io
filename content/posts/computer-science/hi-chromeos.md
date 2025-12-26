一直在找一台笔记本，可以满足我以下需求：

- 屏幕大显示好
- 适配Linux系统
- 没有续航焦虑

而前两天在知乎上刷到了一条我从未想象过的方案：基于谷歌浏览器开发的Chromebook。除了能完美满足上述要求的同时，还搭配了谷歌全家桶应用，这对于身为Gemini/nootebookLM信徒的我来说太有吸引力了。

了解到这个产品线是因为B站经常给我推FydeOS，一款de-Google的ChromeOS操作系统，优雅的UI设计给我留下了不错的初印象。

我一琢磨，在Chromebook上运行基于Debian的Linux容器，应该会比我在wsl上跑Linux更丝滑，至少网络配置不用到处找端口。果断下单。

## OOBE初始设置

### 手动配置代理

首次启动遇到的第一个问题是设置代理，在我只能将Cb连接到热点的前提下，我想要正确地打开【允许局域网】，并且找到对应的ip。

我本以为这会是一个随随便便就能找到教程的小问题，没想到一圈下来没找到，徒然耗费了许多心力。

因为Linux和chrome系统的网络并不互通，我需要并行开两套代理。linux上我采用的是clash for Linux，chrome上则是先用我的台式机共享已经结果代理转发的局域网，再在应用商店安装了v2RayTun,配置好订阅后才算真是解锁谷歌服务。

### ChromeOS

人靠衣裳马靠鞍，谷歌这套一半是linux一半是安卓操作系统在4K屏加持下显得尊贵极了。

并且在GooglePlay里，会把针对chromebook做过优化的应用单独列出来。

在这两天高强度使用里，我体验了tiktok、spotify、YouTube、deepseek、chatgpt、gemini3、earth、Microsoft365等应用，基本没有遇到不适配的问题。
