import { spawnSync } from "child_process"
import { cwd } from "process"

export interface IRequestOptions {
  allowUncommited: boolean
  message: string
  reviewers: string[]
  source: string
  target: string
}

export class GitAppraise {
  private command = "git-appraise"
  private workingDirectory: string = cwd()

  constructor(baseDirectory?: string) {
    if (baseDirectory) {
      this.cwd(baseDirectory)
    }
  }

  // Change the working directory
  public cwd(directory: string) {
    this.workingDirectory = directory
  }

  // Wrapper around `git-appraise abandon`
  public abandon(commit: string, message?: string) {
    const args = ["abandon"]
    if (message) {
      args.push("-m", message)
    }
    args.push(commit)
    this.run(args)
  }

  // Wrapper around `git-appraise accept`
  public accept(commit: string, message?: string) {
    const args = ["accept"]
    if (message) {
      args.push("-m", message)
    }
    args.push(commit)
    this.run(args)
  }

  // Wrapper around `git-appraise list`
  // By default, lists only the open reviews
  // The `all` parameter allows to list all the reviews, including the closed ones
  public list(all = false) {
    const args = ["list", "-json"]
    if (all) {
      args.push("-a")
    }
    this.run(args)
  }

  // Wrapper around `git-appraise pull`
  public pull(remote = "origin") {
    const args = ["pull", remote]
    this.run(args)
  }

  // Wrapper around `git-appraise push`
  public push(remote = "origin") {
    const args = ["push", remote]
    this.run(args)
  }

  // Wrapper around `git-appraise commit`
  public reject(commit: string, message?: string) {
    const args = ["reject"]
    if (message) {
      args.push("-m", message)
    }
    args.push(commit)
    this.run(args)
  }

  // Wrapper around `git-appraise request`
  public request(
    reviewHash: string,
    options: IRequestOptions = {
      allowUncommited: false,
      message: "",
      reviewers: [],
      source: "HEAD",
      target: "refs/heads/master",
    },
  ) {
    const args = [
      "request",
      "-source",
      options.source,
      "-target",
      options.target,
    ]
    if (options.allowUncommited) {
      args.push("-allow-uncommitted")
    }
    if (options.message !== "") {
      args.push("-m", options.message)
    }
    if (options.reviewers.length > 0) {
      args.push("-r", options.reviewers.join(","))
    }
    args.push(reviewHash)
    this.run(args)
  }

  // Wrapper around `git-appraise show`
  public show(commit: string) {
    const args = ["show", "-json", commit]
    this.run(args)
  }

  // Wrapper around `git-appraise show -diff`
  public showDiff(commit: string) {
    const args = ["show", "-diff", commit]
    this.run(args)
  }

  private run(args: string[]) {
    return spawnSync(this.command, args, {
      cwd: this.workingDirectory,
    })
  }
}
