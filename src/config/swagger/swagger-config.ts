import YAML from "yamljs";
import path from "path";

export const swaggerDocument = YAML.load(
  path.resolve(__dirname, "./swagger.yaml"),
);
