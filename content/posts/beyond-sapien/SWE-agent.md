在2025年末，泛CS类的同学已经过上了每天对着chatbot聊聊天，就能把工作完成大半的生活。在**Claude Opus 4.5**发布三天后的此刻，我尝试在VScode上完成本该打开Matlab、Vivado进行的工作，用半天的时间把自适应滤波器的Matlab算法仿真到verilog代码生成全部完成了。我觉得我看到了EE未来的工作模式。下面是一些观察和猜想：

## VScode的开源插件优势将帮助SWE发挥巨大杠杆优势

vscode将从之前扮演code和硬件开发的桥梁角色逐步演进为工具枢纽：

Matlab、Verilog这类插件功能完善的开发将被范式转移到VScode上，由SWE完成具体的工作

## 立党老师的第一性原理

>
> 一切能用coding解决的问题，都是SWE Agent能解决的问题，也就是说，都可以直接拿claude code这类工具套壳来用，
>
> SWE Agent这个形态，最擅长解决的问题，就是在一个确定的环境（一台机器、几台机器、若干仿真环境、一套terminal里的编译器/脚手架/运行环境/包管理、profiling和debugging方法）解决的问题，
>
> 而用coding解决的问题，从来都不止coding，一切VHDL/Verilog等电路设计、电路simulation和validation、一切类似labview和matlab simulink中可以仿真的电机、信号、示波器等等模块，
>
> 甚至ansys和CAD这类工具，还有大量data science和计算的问题，以及用lean或者formal-proof解决一些proof-based的数学和模型问题，都可以转化成一些API和coding解决的问题，然后让SWE Agent来解决，
>
> 这类问题可以叫做“一台机器上的确定环境下的问题”，
>
> 这类问题的特点是，可以靠LLM的智能不断拆分成一大堆subtasks，然后在本地环境下反复尝试、反复试错、反复看output、反复试验结果，失败后再换一个新的approach；

## 商业变现模式

从Claude Opus 4.5发布的那一刻，就意味着一个不仅在CS，包括EE/机械/物理等邻域拥有等效phd学位技能水平的廉价劳动力任你调用。

任何有VScode插件的仿真工具都降格为能看得懂输出报告质量就能入门生产的简单工具。

最简单最直接的变现手段无非是作业代做，外包接活。这显然效率太低。

进一步可以卖铲子，教硕博士们变革自己的工具链。
