Thanks for helping to improve this project! It’s great to have you here.

Here are a few things to know as you contribute.

## Asking questions and getting help
The best place to ask your question is in a new issue. You can open one [here](https://github.com/ethanresnick/json-api/issues/new)!

## Reporting bugs or requesting features
You can also report bugs or ask for features by [opening an issue](https://github.com/ethanresnick/json-api/issues/new). Before you do, though, _please search the archive to make sure your issue hasn’t already been reported_.

When you submit an issue, help provide the following to help me address it:

### For bug/error reports
- Steps to reproduce the error.
- A stack trace for the error being thrown, if any.
- The version of node and of the json-api library that you’re using.
- Suggestions for a fix. If you can’t fix the bug yourself, perhaps you can point to what might be causing the problem (i.e. the line of code or commit).

### For feature requests
- Explain the need you have for the feature and why it can’t be handled with the existing functionality.

## Contributing code

1. **Forking and Submitting PRs.** After you [fork the repository](https://help.github.com/articles/fork-a-repo/), please make your changes in a [new branch](https://help.github.com/articles/creating-a-pull-request/) and then submit a pull request. This is standard procedure and can all be done through the GitHub website.

2. **Compiling.** This library is written in TypeScript, so it needs to be "compiled" to JavaScript to run on Node. This can be done with the `npm run build` command. Note that this isn't needed if you just want to run the tests.

3. **Running tests.** Just run `npm test`. The [`ts-node`](https://github.com/TypeStrong/ts-node) tool will handle compilation from TypeScript to JavaScript on the fly.

4. **Code style.** Once you’ve written your code, make sure that it complies with this repository’s style guidelines by running `npm run lint` from the project’s root directory and fixing any errors that show up.

5. **Before you submit.** Before submitting your PR, make sure that all the tests still pass and that you've added tests (in the `/test` directory) to cover your new code. To keep this library reliable, I generally don't accept pull requests with missing or broken tests.

# Documentation, etc.

This library is currently documented primarily in the Readme. The [example API](https://github.com/ethanresnick/json-api-example) project can also serve as a useful reference, as can the comments in the code, which are generally thorough.

Help with documentation—or anything else that makes this project easier to use—is always appreciated! Feel free to discuss/submit improvements in an issue or pull request.
