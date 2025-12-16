摘录一则非常有意思的Git笑话：

> 你为啥直接commit到我的master分支啊？Github上根本不是这样！
>
> 你应该先fork我的仓库，然后从develop分支checkout一个新的feature分支， 比如叫feature/confession，然后你把你的心意写成代码，并为它写好单元测试和集成测试，确保代码覆盖率达到95%以上。接着你要跑一下linter通过所有的代码风格检查，然后你再commit。之后你把这个分支push到自己的远程仓库，然后给我提一个Pull Request，在PR描述里，你要详细说明你的功能改动和实现思路。
>
> 你怎么直接上来就想force push到mian，GitHub上根本不是这样，我拒绝合并！

所以，不论是明面上写在[git官方文档](https://git-scm.com/book/en/v2)里的规矩，还是程序员们约定俗成的实践经验，Git的使用都比想象中要复杂得多。
## Git的起点
作为Git的开发者，Linux之父Linus Torvalds在2005年写下了Git的第一个版本。今年正好是git诞生的20周年纪念。

不妨将时间拨回我