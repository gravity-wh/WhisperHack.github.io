# 吉他乐理：CAGED 系统与指板记忆

学习 CAGED 不是为了炫技，而是让手指有地图可循。

## 方法

- 把 C、A、G、E、D 五个形状对应到任意调式。
- 每个形状写下三个音程：根音、三度、五度，确认它们的相对位置。
- 在节奏练习里加入“形状切换”——比如每四拍切到下一个形状。

## 工具

我在 `posts/post.html` 使用的 Markdown 渲染支持内嵌乐谱示例，因此可以直接贴上 ASCII 标签或图片。同时，`content/posts.json` 中新增的 `category`、`frequency` 字段会让广播站首页自动同步更新。##

## 乐谱示例


```abc
X:1                   % 乐谱编号（必选）
T:Prélude in C Major  % 曲名（原作标题）
C:Johann Sebastian Bach  % 作曲家
O:BWV 1007            % 作品编号
M:4/4                 % 节拍（4/4拍，原作基础律动）
K:C                   % 调号（C大调，无升降）
Q:1/4=60              % 速度标记（四分音符=60拍，行板速度）
P:Intro               % 乐段标记（前奏段落）
V:1 clef=bass         % 声部1（大提琴专用低音谱表）
L:1/4                 % 基础时值（四分音符为单位）
D:mf                  % 力度标记（中强，原作开篇力度）
S:"Cello Solo - Unaccompanied"  % 附加说明（无伴奏大提琴）
Z:20251125            % 转录日期
% 前8小节核心织体（分解和弦式音型，纯五度交替，贴合原作线条）
!pizz.! C,8 G,,8 C,,4 G,,4 | !tenuto! C,,4 G,,4 C,4 G,,4 |  % 第1-2小节：拨奏+保持音，低音区铺垫
!accent! G,,4 C,,4 G,,4 C,4 | !staccato! G,4 C,4 G,,4 C,,4 |  % 第3-4小节：重音+断奏，线条上行
!trill! C,4 G,4 C4 G,4 | !slur! (G,4 C,4) G,,4 C,,4 |  % 第5-6小节：颤音+连音，中音区过渡
!fermata! C,,4 G,,4 C,4 G,4 | !dim.! G,4 C4 G,4 C,4 !fine! |  % 第7-8小节：延长音+渐弱，段落收尾
```


X: 24
T: Clouds Thicken
C: Paul Rosen
S: Copyright 2005, Paul Rosen
M: 6/8
L: 1/8
Q: 3/8=116
R: Creepy Jig
K: Em
|:"Em"EEE E2G|"C7"_B2A G2F|"Em"EEE E2G|
"C7"_B2A "B7"=B3|"Em"EEE E2G|
"C7"_B2A G2F|"Em"GFE "D (Bm7)"F2D|
1"Em"E3-E3:|2"Em"E3-E2B|:"Em"e2e gfe|
"G"g2ab3|"Em"gfeg2e|"D"fedB2A|"Em"e2e gfe|
"G"g2ab3|"Em"gfe"D"f2d|"Em"e3-e3:|

```abc
X: 24
T: Clouds Thicken
C: Paul Rosen
S: Copyright 2005, Paul Rosen
M: 6/8
L: 1/8
Q: 3/8=116
R: Creepy Jig
K: Em
|:"Em"EEE E2G|"C7"_B2A G2F|"Em"EEE E2G|
"C7"_B2A "B7"=B3|"Em"EEE E2G|
"C7"_B2A G2F|"Em"GFE "D (Bm7)"F2D|
1"Em"E3-E3:|2"Em"E3-E2B|:"Em"e2e gfe|
"G"g2ab3|"Em"gfeg2e|"D"fedB2A|"Em"e2e gfe|
"G"g2ab3|"Em"gfe"D"f2d|"Em"e3-e3:|```abc
```


```abc
 CDCD 
```
