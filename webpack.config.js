module.exports = {
  // ... other config
  ignoreWarnings: [
    /Failed to parse source map/,
    /Module not found/,
    /Critical dependency/,
    {
      module: /node_modules/,
      message: /Critical dependency/,
    }
  ],
};