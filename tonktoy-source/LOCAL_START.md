# tonktoy 本地启动（Mac）

本资料夹来自 `tonkhsueh777-oss/tonktoy` 的 `main` 分支。
打包版本：`00574ecbd0b1102220bb44e8c9e1aba525721ce1`。原有源码、assets、skills、测试和 CODEX_OPTIMIZATION.md 均完整保留；仅新增本说明。不包含 Git 历史，无需连接 GitHub 即可使用。

## 最简单启动方式

1. 双击 `tonktoy-local.zip` 解压，将 `tonktoy-local` 文件夹放到方便的位置（例如「下载」或「文稿」）。
2. 打开 Mac「终端」，输入 `cd `（注意后面有一个空格），把 Finder 中的 `tonktoy-local` 文件夹拖进终端，再按回车。
3. 输入以下命令并按回车：

   ```sh
   python3 -m http.server 8080 --bind 127.0.0.1
   ```

4. 保持终端开启，在浏览器打开 <http://localhost:8080>，即可上传图片、编辑和下载。
5. 使用完后，在终端按 `Control + C` 停止服务。

如提示找不到 `python3`，可先直接双击文件夹内的 `index.html` 使用；若要通过上述本地网址启动，请安装 Python 3 后重试。如果 8080 端口已被占用，把命令中的 8080 改为 8081，并打开 <http://localhost:8081>。

本项目无需 `npm install` 或编译。图片网址导入仍受来源网站的跨域限制；可先将图片保存到 Mac 再上传。

## 在 Codex 中打开

1. 打开 Codex，点击「新建项目」（或「＋ 新建项目」）。
2. 选择已解压的 **tonktoy-local 文件夹**，不是 ZIP 文件，也不是里面的单个文件。
3. 进入项目后，即可请 Codex 检查或修改本地源码。需要优化时，可让它先阅读 `CODEX_OPTIMIZATION.md`。
4. 本地确认运行顺畅后，再另行要求部署。打开资料夹和启动本地服务都不会自动部署或修改 GitHub。
