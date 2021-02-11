import { Probot } from "probot";

export = (app: Probot) => {
  app.webhooks.onAny(async (context) => {
    app.log.info({ event: context.name, action: context.payload.action });
  });

  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  app.on("check_run", async (context) => {
    app.log.info({
      name: context.payload.check_run.name,
      status: context.payload.check_run.status,
      conclusion: context.payload.check_run.conclusion,
      url: context.payload.check_run.html_url,
    });
  });

  app.on("check_suite", async (context) => {
    app.log.info({
      status: context.payload.check_suite.status,
      conclusion: context.payload.check_suite.conclusion,
    });
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
