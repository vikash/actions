const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');


var process = async function() {

    // Decide if we want to build Docker
    if (github.context.ref.startsWith("refs/tags/") === false) {
        core.info("This commit is not tagged. Build is not required.")
        return
    }

    // Docker Login with github packages
    try {
        const username = github.context.actor;
        const token = core.getInput("repo-token");
        await exec.exec(`docker login docker.pkg.github.com -u ${username} -p ${token}`);
    } catch (err) {
        core.setFailed(`Could not login to github packages: ${err}`);
    }


    // Build the docker container with tag
    try {
        const tag = github.context.ref.slice(10)
        const repo = github.context.repo.repo.toLowerCase()
        const dockerURL = `docker.pkg.github.com/${repo}:${tag}`
        core.info("Git tag Found: " + tag)

        await exec.exec(`docker build -t ${dockerURL} .`);
    } catch (err) {
        core.setFailed(`Could not build the docker container. ${err}`)
    }

    // Push the container
    try {
        await exec.exec(`docker push ${dockerURL}`);
    } catch (err) {
        core.setFailed(`Docker Push Failed. ${err}`);
    }

    core.setOutput("docker-url", dockerURL)

}

process();