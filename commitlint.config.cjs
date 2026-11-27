module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // PR titles are squashed into main, so they must be Conventional Commits.
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
  },
}
