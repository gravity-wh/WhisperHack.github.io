摘录一则非常有教学指导意义的Git笑话：

> 你为啥直接commit到我的master分支啊？Github上根本不是这样！
>
> 你应该先fork我的仓库，然后从develop分支checkout一个新的feature分支， 比如叫feature/confession，然后你把你的心意写成代码，并为它写好单元测试和集成测试，确保代码覆盖率达到95%以上。接着你要跑一下linter通过所有的代码风格检查，然后你再commit。之后你把这个分支push到自己的远程仓库，然后给我提一个Pull Request，在PR描述里，你要详细说明你的功能改动和实现思路。
>
> 你怎么直接上来就想force push到mian，GitHub上根本不是这样，我拒绝合并！

所以，不论是明面上写在[git官方文档](https://git-scm.com/book/en/v2)里的规矩，还是程序员们约定俗成的实践经验，Git的使用都比我想象中要复杂得多。

这个暑假最大的收获，可能就是在RDG学长的耐心指点下，学会了git。

希望今天在整理完Git的常见commmand之后，能更加得心应手地把我的项目、代码、作业用Git管理起来。

Todo list:

1.解释最常见的Git命令：init,add,commit,push,pull,remote,clone,branch,merge,checkout,status,log

2.Github的使用

## Git的起点

作为Git的开发者，Linux之父Linus Torvalds在2005年写下了Git的第一个版本,今年正好是git诞生的20周年纪念。

现在，如果我是Linux，我应该如何对这个问题建模？

假设只有一个项目，一位开发者，那么一个线性的版本控制即可。在词基础上，一点点增加复杂度：

1. 多个开发者：需要区分不同开发者的提交记录：
   - 解决方案：每个开发者有自己的分支，最后合并到主分支。相关的命令：[branch]从main创建分支，[checkout]切换分支，[merge]合并分支。形如：git branch feature/xyz ； git checkout feature/xyz ； git merge main
   - 问题：多个开发者同时修改同一文件的同一部分，如何解决冲突？
     解决方案：Git会提示冲突，需要手动解决冲突后再提交。
2. 远程协作：开发者分布在不同地点，需要一个中心仓库进行协作：
   - 解决方案：使用远程仓库（如GitHub）进行协作。相关命令：[remote]添加远程仓库，[push]推送本地分支到远程仓库，[pull]从远程仓库拉取最新代码。形如：git remote add origin <repo_url>； git push origin main； git pull origin main
3. 版本回溯：需要能够回溯到之前的版本。
   - 解决方案：Git使用commit记录每次修改，可以通过[log]查看历史记录，通过[checkout]回溯到之前的版本。形如：git log； git checkout <commit_hash>
   - 问题：如何查看两个版本之间的差异？
   - 解决方案：[diff]命令可以查看两个版本之间的差异。
   - 形如：git diff <commit_hash1> <commit_hash2>
   - 问题：如何获取远程仓库的最新代码而不合并？
   - 解决方案：[fetch]命令可以获取远程仓库的最新代码而不合并。
   - 形如：git fetch origin
   - 问题：如何查看当前工作区的状态？
     解决方案：[status]命令可以查看当前工作区的状态。
     形如：git status

4.工作流：本地仓库由git init初始化后，工作区、暂存区和本地仓库的关系：

- 工作区：用户进行代码编辑的地方。
- 暂存区：用git add命令将工作区的修改添加到暂存区。
- 本地仓库：用git commit命令将暂存区的修改提交到本地仓库。
- 形如：git init； git add `<file>`； git commit -m "message"

   暂存区存在的意义在于，可以将多个修改打包成一个提交，便于管理和回溯。

## 一些有意思的Git命令

- gitk：图形化查看Git历史记录的工具,第一次在Pycharm里看到车道般的分支图，有一种大脑褶皱被捋顺的畅快。
- git add -p：交互式添加修改到暂存区，可以选择性地添加修改。

## gitignore

.gitignore文件用于指定Git在提交时忽略的文件或目录。常见需要被忽略的文件有：

- 编译生成的二进制文件，如*.exe, *.o, *.class等。
- 临时文件，如*~, *.swp, *.log等。
- API密钥、配置文件等敏感信息应该被忽略，防止泄露。

## Github的使用

有哪些内容适合被上传到Github？Github把我们的文件都存到哪里了，空间有多大？我能当云盘用吗？

如何在Github找到别人的项目？Fork和Clone有什么区别？

### Github的基本知识

Github 是最大的远程代码托管平台，每个用户都可以在上面创建自己的仓库（Repository），其母公司是微软（Microsoft）。因此我们提交上去的代码实际上是存储在微软的云服务器上的，每个免费用户可以创建无限数量的公共仓库（Public Repository），但每个私有仓库的存储空间有限制，通常为500MB。之所以限制私有仓库的存储空间，是为了防止用户将Github当作云盘使用，上传大量非代码文件，占用服务器资源。

### Fork vs Clone

Fork和Clone都是从远程仓库获取代码的方式，但它们有不同的用途和操作方式。

- Fork：Fork是Github特有的功能，允许用户将别人的仓库复制到自己的账户下，形成一个独立的仓库。Fork后的仓库与原始仓库没有直接的关联，用户可以在自己的Fork仓库中进行修改和提交，而不会影响原始仓库。Fork通常用于贡献代码，当用户想要为某个项目做出贡献时，先Fork该项目，然后在自己的Fork仓库中进行修改，最后通过Pull Request将修改提交给原始仓库的维护者。
- Clone：Clone是Git的基本操作，允许用户将远程仓库的代码复制到本地计算机上。Clone后的本地仓库与远程仓库保持关联，用户可以在本地进行修改和提交，然后通过Push将修改推送到远程仓库。Clone适用于任何需要在本地进行开发的场景，无论是自己的仓库还是别人的仓库。

## Acknowledgements

感谢[廖雪峰的Git教程](https://www.liaoxuefeng.com/wiki/896043488029600)提供了非常详细的Git使用指导。

感谢Torvalds和所有Git贡献者开发了这个强大的版本控制工具。

感谢GitHub团队提供了便捷的远程代码托管服务。

没有你们，Coding的世界将会黯然失色！
