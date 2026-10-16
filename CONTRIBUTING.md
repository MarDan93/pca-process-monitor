# Repository and application languages

Use English for repository documentation, code comments, identifiers, test descriptions and new file names. Preserve historical public identifiers where compatibility requires it.

The application supports English (`en`), Italian (`it`), French (`fr`) and Spanish (`es`). English is the default, regardless of browser language. Persist an explicit user selection independently from project data.

Translation catalogues and deliberate multilingual test inputs are exceptions to English source content. Keep catalogue keys aligned, preserve interpolation parameters and localise accessibility text and messages as well as visible labels.

Never translate user-authored project values when changing UI language. Preserve numerical values, filenames, pending edits and validation state. Verify languages in both development and packaged builds.

Use [the roadmap](docs/product/ROADMAP.md) and [implementation status](docs/product/IMPLEMENTATION_STATUS.md) to scope work. Record demo maintenance separately from platform milestones; do not claim planned modules are implemented.
