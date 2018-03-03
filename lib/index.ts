import { spawnSync } from "child_process"
import { cwd } from "process"
import * as which from "which"

export enum CommentStatus {
  ForYourInformation,
  LooksGoodToMe,
  NeedsMoreWork,
}

export interface ICommentOptions {
  file?: {
    path: string
    range?: number | [number, number]
  }
  parentComment?: string
  status: CommentStatus
}

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
  public abandon(commit: string, message: string) {
    if (message === "") {
      throw new Error("Message must not be empty")
    }

    const args = ["abandon", "-m", message, commit]
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

  // Wrapper around `git-appraise comment`
  public comment(
    reviewHash: string,
    message: string,
    options: ICommentOptions = {
      status: CommentStatus.ForYourInformation,
    },
  ) {
    if (message === "") {
      throw new Error("Message must not be empty")
    }

    const args = ["comment", "-m", message, reviewHash]

    if (options.file) {
      args.push("-f", options.file.path)
      if (options.file.range) {
        const range =
          options.file.range instanceof Array
            ? options.file.range.join(":")
            : options.file.range.toString()
        args.push("-l", range)
      }
    }

    switch (options.status) {
      case CommentStatus.LooksGoodToMe:
        args.push("-lgtm")
        break
      case CommentStatus.NeedsMoreWork:
        args.push("-nmw")
        break
      default:
        break
    }

    if (options.parentComment) {
      args.push("-p", options.parentComment)
    }

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
    const ret = this.run(args)
    return JSON.parse(ret.stdout.toString())
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

  // Wrapper around `git-appraise reject`
  public reject(commit: string, message: string) {
    if (message === "") {
      throw new Error("Message must not be empty")
    }

    const args = ["reject", "-m", message, commit]
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
      "-m",
      options.message,
    ]
    if (options.allowUncommited) {
      args.push("-allow-uncommitted")
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
    const ret = this.run(args)
    return JSON.parse(ret.stdout.toString())
  }

  // Wrapper around `git-appraise show -diff`
  public showDiff(commit: string) {
    const args = ["show", "-diff", commit]
    const ret = this.run(args)
    return ret.stdout.toString()
  }

  private run(args: string[]) {
    if (which.sync(this.command, { nothrow: true }) === null) {
      throw new Error(`Executable ${this.command} not found`)
    }
    return spawnSync(this.command, args, {
      cwd: this.workingDirectory,
    })
  }
}
