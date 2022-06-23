import * as core from '@actions/core';
import * as github from '@actions/github';

export const getFileStatusIcon = (status = '') => {
  if (status === 'A') {
    return '<b title="Added"><img height="12px" src="https://cdn.pixabay.com/photo/2014/04/02/10/55/plus-304947_1280.png" alt="🟩"/></b>';
  }
  if (status === 'M') {
    return '<b title="Modified"><img height="12px" src="https://icons-for-free.com/download-icon-refresh+reload+sync+update+icon-1320137054460780608_512.png" alt="🟨"/></b>';
  }
  if (status === 'D') {
    return '<b title="Deleted"><img height="12px" src="https://www.pngall.com/wp-content/uploads/5/Red-Minus-PNG-High-Quality-Image.png" alt="🟥"/></b>';
  }
  if (status.indexOf('R') === 0) {
    return '<b title="Renamed">𝖨a</b>';
  }
  if (status === 'U') {
    return '<b title="UnModified">🔳</b>'
  }
  return status;
}

const convertRowDataToRow = (columns) => {
  return `| ${columns.join(' | ')} |`;
}

export const createMarkdownTable = <T extends Record<string, string>>(headers: T) => {
  const headerKeys = Object.keys(headers) as (keyof T)[];
  const rows: (string | number | boolean | symbol)[][] = [headerKeys];
  rows.push(headerKeys.map(() => `--------`));

  const addRow = (row: Record<keyof T, string | number | boolean>) => {
    const rowData = headerKeys.map((headerKey) => row[headerKey]);
    rows.push(rowData);
  };

  const toString = () => {
    const [header, ...restRows] = rows;
    const headerLabels = header.map((headerKey: string) => headers[headerKey]);
    const newRows = [headerLabels, ...restRows];
    return newRows.map(convertRowDataToRow).join('\n');
  }

  const table = {
    addRow,
    toString,
  }

  return table;
};

export const addCommentOnPR = (message: string, identifier: string) => {
  if (process.env.GITHUB_ACTIONS) {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;
    const prId = context.payload.pull_request.number;
    const newComment = octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: prId,
      body: message + '\n\n' + `\`_${identifier}_\``,
    });
    return newComment;
  }
  return Promise.resolve();
}

export const deleteComment = async (commentId: number) => {
  if (process.env.GITHUB_ACTIONS) {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;
    const deleteComment = await octokit.rest.issues.deleteComment({
      ...context.repo,
      comment_id: commentId,
    });
    console.info(`Deleted comment: ${commentId}`);
    return deleteComment;
  }
  return Promise.resolve();
}

export const addOrRenewCommentOnPR = async (message: string, identifier: string) => {
  if (process.env.GITHUB_ACTIONS) {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;
    const prId = context.payload.pull_request.number;
    const comments = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: prId,
    });
    const comment = comments.data.find((comment) => comment.body.includes(identifier));
    if (comment) {
      const newComment = await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: comment.id,
        body: message + '\n' + `_${identifier}_`,
      });
      return newComment;
    } else {
      return addCommentOnPR(message, identifier);
    }
  }
  return Promise.resolve();
}

export const addNewSingletonComment = async (message: string, identifier: string) => {
  if (process.env.GITHUB_ACTIONS) {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;
    const prId = context.payload.pull_request.number;
    const comments = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: prId,
    });
    const comment = comments.data.find((comment) => comment.body.includes(identifier));
    if (comment) {
      await deleteComment(comment.id);
    }
    return addCommentOnPR(message, identifier);
  }
  return Promise.resolve();
}
