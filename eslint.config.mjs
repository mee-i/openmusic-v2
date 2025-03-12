import globals from "globals";

export default [{
    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 2020,
        sourceType: "commonjs",
    },

    rules: {
        "no-console": "off",
        "linebreak-style": "off",
        "no-underscore-dangle": "off",
        camelcase: "off",
    },
}];