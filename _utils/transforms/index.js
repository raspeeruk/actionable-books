const htmlmin = require("html-minifier");

module.exports = function(eleventyConfig) {
    eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
        if (outputPath && outputPath.endsWith(".html")) {
            try {
                let minified = htmlmin.minify(content, {
                    useShortDoctype: true,
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true
                });
                return minified;
            } catch(e) {
                console.warn(`HTML minification failed for ${outputPath}:`, e.message);
                return content;
            }
        }
        return content;
    });
}