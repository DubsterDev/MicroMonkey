# Using Git

MicroMonkey has built-in support for version control using Git. After connecting a board to MicroMonkey, the Git panel will be displayed on the right of the code editor.

If it's your first time using Git in MicroMonkey, you'll see an Setup Git button. If you click this button, it will ask you a few questions, such as what name and email you want to use for committing, and finally, what you want to name your git repo. MicroMonkey stores the git repo under this name so it knows what Git repo to use for the connected board. This name should be different for every connected board.

<small>(It is technically possible to use the same repo on multiple boards, but it's not the best idea. [See the section about it here](#using-same-git-repo))</small>.

## Committing

To commit files, you'll just use the commit button on the Git panel. Only staged files are committed. You can stage files by checking the box next to the file name.

## Viewing what changed in a file

If you click the name of a file in the changes section of the Git panel, a split pane editor will open showing you the difference in the current file and what was last committed to Git. Nothing will happen if the file has never been committed before.

## Downloading the .git folder

Currently, MicroMonkey supports download the `.git` folder to your computer as a .zip. Later, we'd like to support uploading it too, but that's not a feature yet.

To download it as a .zip folder, make sure the Git panel is loaded and use the command `[Git] Download .git folder as ZIP` in the command palette.

## Remotes

MicroMonkey has basic support for pushing and pulling. To get started, use the command palette to run `[Git] Add/update remote`. It will ask for the URL of the git repo.

After you've added a remote, you can use `[Git] Push` to push your changes to your remote. It will ask for your git credentials and store them in memory until you close or refresh the page. It does not support pushing to a remote if there is merge conflicts and you will get an error message.

You can also use `[Git] Pull`. This *does* allow merge conflicts, and if there are any, it will write the merge markers to your connected board. After you've resolved the conflicts, you can commit the resolved changes and pushing should work as well.

## Using a CORS Proxy

Most remotes have a CORS policy, making it impossible to push or pull from a site that isn't from the same origin. You'll get the error `Failed to fetch` if the repo you're trying to push to has CORS enabled. This error message may also show up if you have no internet connection.

You can get around this error with a CORS Proxy. If you have `npm`, you can install isomorphic-git's CORS Proxy:

```bash
npm install -g @isomorphic-git/cors-proxy
```

Then, you can run it:

```bash
cors-proxy run
```

Finally, open the Settings page in MicroMonkey and put `http://localhost:9999` in the input labeled `CORS Proxy`. Pushing and pulling to remotes should work now!

### CORS Proxy with insecure git remotes

If you need to use an insecure (http) remote, you have to add the `INSECURE_HTTP_ORIGINS` enviroment variable with the origins of the URLs you will be connecting to, seperated by commas, before running the `cors-proxy` command.

For example:

```bash
INSECURE_HTTP_ORIGINS="localhost:3245,insecuregitserver.com" cors-proxy run
```

## How it works

Git support in MicroMonkey is slightly different than typical IDEs. In MicroMonkey, the `.git` folder is stored in your browser's storage, unlike traditional IDEs, where it's stored alongside the files.

The reason for doing this is it would require a lot of read and write operations to your board, if it were to store the `.git` folder on the board, and it may even use up the storage space.

## Using the same Git repo on multiple boards {#using-same-git-repo}

> [!WARNING]
> Please only do this if you know what you are doing. Unless you synchronize the files between boards, you could have issues.

First, open the `.mmgitrepo` file on the board with the Git repo you want to use on the other board, and copy the contents. (If you know what you named the Git repo for that board you don't need to do this.)

On the other board, create or modify the `.mmgitrepo` with the name of the git repo from the other board. This should be exactly what you named the repo on the other board, and there should not be a new line or spaces unless you included it in the name of the repo.

Then disconnect and reconnect the board to get Git to recognize the new repo. If everything worked, you should see any changes you made on the Git panel and commit. The Git repo will now be the same between the two boards.

You can do this to as many boards as you want, just beware that files won't automatically sync between boards.

If you've modified a file on a different board and committed it, you can always revert the "changes" to get the same file as what you had on the other board.