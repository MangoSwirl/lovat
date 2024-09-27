export const lovatAPI = new sst.aws.Function("LovatAPI", {
  handler: "packages/api/src/index.handler",
});
