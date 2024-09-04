const flatten = require('flat');
const got = require('got');

const {
  GITHUB_URL = 'https://github.com',
  GITHUB_API_URL = 'https://api.github.com',
  LOGZIO_TOKEN = ''
} = process.env;

var logger = require('logzio-nodejs').createLogger({
  token: LOGZIO_TOKEN,
  type: 'pr'
});

const newJsonWebToken = require('./newJsonWebToken.js');

const accessTokens = {};

async function updateShaStatus(body) {
  const accessToken = accessTokens[`${body.installation.id}`].token;
  const pullRequestFlattened = flatten(body.pull_request);

  try {
    // Initialize variables
    let prlintDotJson;
    const failureMessages = [];
    const failureURLs = [];
    const headRepoFullName = body.pull_request.head.repo.full_name;
    const defaultFailureURL = `${GITHUB_URL}/${headRepoFullName}/blob/${
      body.pull_request.head.sha
    }/.github/prlint.json`;

    // Get the user's prlint.json settings (returned as base64 and decoded later)
    let prlintDotJsonUrl = `${GITHUB_API_URL}/repos/${headRepoFullName}/contents/.github/prlint.json?ref=${body
      .pull_request.merge_commit_sha || body.pull_request.head.ref}`;
    if (body.pull_request.head.repo.fork) {
      prlintDotJsonUrl = `${GITHUB_API_URL}/repos/${
        body.pull_request.base.repo.full_name
      }/contents/.github/prlint.json?ref=${body.pull_request.head.sha}`;
    }
    const prlintDotJsonMeta = await got(prlintDotJsonUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
    });

    // Convert the base64 contents to an actual JSON object
    try {
      prlintDotJson = JSON.parse(
        Buffer.from(JSON.parse(prlintDotJsonMeta.body).content, 'base64'),
      );
    } catch (e) {
      failureMessages.push(e);
    }

    // Run each of the validations (regex's)
    if (prlintDotJson) {
      Object.keys(prlintDotJson).forEach((element) => {
        if (prlintDotJson[element]) {
          prlintDotJson[element].forEach((item, index) => {
            const { pattern } = item;
            try {
              const regex = new RegExp(pattern, item.flags || '');
              const pass = regex.test(pullRequestFlattened[element]);
              if (!pass || !pullRequestFlattened[element]) {
                let message = `Rule \`${element}[${index}]\` failed`;
                message = item.message || message;
                failureMessages.push(message);
                const URL = item.detailsURL || defaultFailureURL;
                failureURLs.push(URL);
              }
            } catch (e) {
              failureMessages.push(e);
              failureURLs.push(defaultFailureURL);
            }
          });
        }
      });
    }

    // Build up a status for sending to the pull request
    let bodyPayload = {};
    if (!failureMessages.length) {
      bodyPayload = {
        state: 'success',
        description: 'Your validation rules passed',
        context: 'PRLintReloaded',
      };
    } else {
      let description = failureMessages[0];
      let URL = failureURLs[0];
      if (failureMessages.length > 1) {
        description = `1/${failureMessages.length - 1}: ${description}`;
        URL = defaultFailureURL;
      }
      if (description && typeof description.slice === 'function') {
        bodyPayload = {
          state: 'failure',
          description: description.slice(0, 140), // 140 characters is a GitHub limit
          target_url: URL,
          context: 'PRLintReloaded',
        };
      } else {
        bodyPayload = {
          state: 'failure',
          description:
            'Something went wrong with PRLintReloaded - You can help by opening an issue (click details)',
          target_url: 'https://github.com/maor-rozenfeld/prlint-reloaded/issues/new',
          context: 'PRLintReloaded',
        };
      }
    }

    // POST the status to the pull request
    try {
      const statusUrl = body.pull_request.statuses_url;
      await got.post(statusUrl, {
        headers: {
          Accept: 'application/vnd.github.machine-man-preview+json',
          Authorization: `token ${accessToken}`,
        },
        body: bodyPayload,
        json: true,
      });
      return { statusCode: 200, body: bodyPayload};
    } catch (exception) {
      return {statusCode: 500, body: {
        exception,
        request_body: bodyPayload,
        response: exception.response.body,
      }};
    }
  } catch (exception) {
    // If anyone of the "happy path" logic above failed
    // then we post an update to the pull request that our
    // application (PRLint) had issues, or that they're missing
    // a configuration file (./.github/prlint.json)
    let statusCode = 200;
    const statusUrl = `${GITHUB_API_URL}/repos/${
      body.repository.full_name
    }/statuses/${body.pull_request.head.sha}`;
    if (exception.response && exception.response.statusCode === 404) {
      await got.post(statusUrl, {
        headers: {
          Accept: 'application/vnd.github.machine-man-preview+json',
          Authorization: `token ${accessToken}`,
        },
        body: {
          state: 'success',
          description: 'No rules are setup for PRLintReloaded',
          context: 'PRLintReloaded',
          target_url: `${GITHUB_URL}/apps/PRLint-Reloaded`,
        },
        json: true,
      });
    } else {
      statusCode = 500;
      await got.post(statusUrl, {
        headers: {
          Accept: 'application/vnd.github.machine-man-preview+json',
          Authorization: `token ${accessToken}`,
        },
        body: {
          state: 'error',
          description:
            'An error occurred with PRLintReloaded. Click details to open an issue',
          context: 'PRLintReloaded',
          target_url: `https://github.com/maor-rozenfeld/prlint-reloaded/issues/new?title=Exception Report&body=${encodeURIComponent(
            exception.toString(),
          )}`,
        },
        json: true,
      });
    }
    return { statusCode, body: exception.toString()};
  }
}

// Get a JWT on server start
let JWT = newJsonWebToken();

// Refresh the JSON Web Token every X milliseconds
// This saves us from persisting and managing tokens
// elsewhere (like redis or postgresql)
setInterval(() => {
  JWT = newJsonWebToken();
}, 300000 /* 5 minutes */);

// This is the main entry point, our dependency 'micro' expects a function
// that accepts standard http.IncomingMessage and http.ServerResponse objects
// https://github.com/zeit/micro#usage
exports.handler = async (event) => {
  if (event.headers['x-prlint-debug'] === 'true') {
    info("request: " + JSON.stringify(event));
  }

  const http = event.requestContext.http;

  if (http.path === '/favicon.ico') {
    logger.sendAndClose()
    return { statusCode: 200 , headers: {'Content-Type': 'image/x-icon'}};
  }

  // Used by https://stats.uptimerobot.com/ZzYnEf2BW
  if (http.path === '/status' && http.method === 'GET') {
    logger.sendAndClose()
    return { statusCode: 200, body: { 'message': 'still alive' } };
  }

  const body = JSON.parse(event.body);

  const metadata = { repoOwner: body?.repository?.owner?.login, repoName: body?.repository?.name }

  // Used by GitHub
  if (http.path === '/webhook' && http.method === 'POST') {
    if (body && !body.pull_request) {
      // We just return the data that was sent to the webhook
      // since there's not really anything for us to do in this situation
      info('Not a pull request', metadata)
      logger.sendAndClose()
      return { statusCode: 200, body };
    }
    
    if (body && body.action && body.action === 'closed') {
      info('Pull request is closed', metadata)
      logger.sendAndClose()
      return { statusCode: 200, body };
    }

    info(`Handling PR ${body.pull_request.number} in ${body.repository.full_name}`, {
        ...body.installation,
        prNumber: body.pull_request.number,
        prTitle: body.pull_request.title,
        prStatus: body.pull_request.state,
        repo: body.repository.full_name,
        repoOwner: body.repository.owner.login,
        repoName: body.repository.name,
        private: body.repository.private
      });

    if (
      body
      && body.pull_request
      && body.installation
      && body.installation.id
      && accessTokens[`${body.installation.id}`]
      && new Date(accessTokens[`${body.installation.id}`].expires_at) > new Date() // make sure token expires in the future
    ) {
      debug('Updating PR status', metadata)
      // This is our main "happy path"
      let lambdaResponse = await updateShaStatus(body);
      logger.sendAndClose()
      return lambdaResponse;
    }
    
    if (
      body
      && body.pull_request
      && body.installation
      && body.installation.id
    ) {
      // This is our secondary "happy path"
      // But we need to fetch an access token first
      // so we can read ./.github/prlint.json from their repo
      try {
        debug('Fetching access token', { jwt: JWT.substring(0,20) + '...', ...metadata })
        const response = await got.post(`${GITHUB_API_URL}/app/installations/${body.installation.id}/access_tokens`, {
          json: {},
          headers: {
            Accept: 'application/vnd.github.machine-man-preview+json',
            Authorization: `Bearer ${JWT}`,
          },
          responseType: 'json',
        });
        accessTokens[`${body.installation.id}`] = response.body;

        info('Updating PR status with new token', metadata)
        let lambdaResponse = await updateShaStatus(body);
        logger.sendAndClose()
        return lambdaResponse;
      } catch (exception) {
        error('Failed to fetch access token', exception, metadata);
        logger.sendAndClose()
        return {statusCode: 500, body: {
          token: accessTokens[`${body.installation.id}`],
          exception
        }};
      }
    } 
    // Doubtful GitHub will ever end up at this block
    // but it was useful while I was developing
    error('Invalid payload', null, metadata)
    logger.sendAndClose()
    return { statusCode: 400, body: { error: 'invalid request payload'}};
  }
  
  else {
    // Redirect since we don't need anyone visiting our service
    // if they happen to stumble upon our URL
    info('Redirecting to GitHub repo')
    logger.sendAndClose()
    return { statusCode: 301, headers: { Location: 'https://github.com/maor-rozenfeld/prlint-reloaded' } };
  }
};

function info(message, data) {
  logger.log({ message, event: data, level: 'info' });
}

function error(message, error, data) {
  logger.log({ message, event: data, error, level: 'error' });
}

function debug(message, data) {
  logger.log({ message, event: data , level: 'debug'});
}