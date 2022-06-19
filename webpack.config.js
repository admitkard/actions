const path = require('path');
const fs = require('fs');
const CopyPlugin = require("copy-webpack-plugin");

const getFoldersInDir = (directory) => {
  const folders = [];
  const dir = path.resolve(directory);
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    folders.push(file);
  });
  return folders;
};

const getActionName = (env) => {
  const action = env.action;
  if (!action) {
    throw new ('No action specified');
  } else {
    const allActions = getFoldersInDir('./src/actions');
    if (!allActions.includes(action)) {
      throw new (`Action not found: ${action}`);
    }
  }
  return action;
};


const getWebpackConfig = (env, argv) => {
  const actionName = getActionName(env);
  const actionsDir = path.join(process.cwd(), 'src/actions', actionName);
  const entry = path.join(actionsDir, 'index.ts');

  const config = {
    mode: 'production',
    entry: entry,
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.join(actionsDir, 'action.yml'), to: path.join(__dirname) },
        ],
      }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    target: 'node',
    optimization: {
      minimize: false
    },
  };
  return config;
}

module.exports = getWebpackConfig;
