# SUDOPOWER Blog

A terminal-inspired blog built with Hugo, featuring a dark theme optimized for developers and technical content.

## Features

- **Terminal Aesthetic**: Dark theme with green-on-black color scheme
- **Fast Performance**: Static site generation with Hugo
- **Syntax Highlighting**: Excellent code highlighting with Monokai theme
- **SEO Optimized**: Open Graph, Twitter Cards, and meta tags
- **Social Sharing**: Built-in sharing buttons for social platforms
- **Image Optimization**: Automatic image processing and optimization
- **Responsive Design**: Mobile-friendly terminal interface

## Local Development

### Prerequisites

- Hugo (Extended version)
- Git

### Setup

1. Clone the repository
2. Install Hugo (if not already installed):
   ```bash
   brew install hugo
   ```

3. Start the development server:
   ```bash
   hugo server --buildDrafts --bind 0.0.0.0 --port 1313
   ```

4. Open http://localhost:1313 in your browser

### Writing Posts

Create a new post:
```bash
hugo new content posts/your-post-title.md
```

Edit the front matter and content, then preview locally.

## Deployment

The blog is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the main branch.

### Automatic Deployment

- **Trigger**: Push to `main` branch
- **Build**: Hugo static site generation
- **Deploy**: GitHub Pages
- **URL**: https://sudopower.com/blog/

### Manual Deployment

Build the site:
```bash
hugo --buildDrafts
```

The generated files will be in the `public/` directory (which is gitignored).

### GitHub Actions Workflow

The deployment is handled by the **top-level** `.github/workflows/static.yml`:
- Installs Hugo Extended
- Builds the blog with production settings
- Integrates blog output into main site structure
- Deploys both main site and blog to GitHub Pages
- Uses the correct baseURL for production

**Note**: The blog's `.github` folder was removed to avoid conflicts with the main site's workflow.

## Theme Structure

The blog uses a custom terminal theme located in `themes/terminal/`:

- `layouts/` - Hugo templates
- `static/css/` - Stylesheets (copied from main website)
- `static/js/` - JavaScript files (copied from main website)
- `static/css/blog.css` - Blog-specific styles

## Configuration

Key configuration in `hugo.toml`:

- **Syntax Highlighting**: Monokai theme with line numbers
- **Image Processing**: Lanczos resampling, 75% quality
- **SEO**: Open Graph and Twitter Card support
- **Performance**: Minification and optimization enabled

## Content Guidelines

- Write posts in Markdown
- Use front matter for metadata (title, description, tags, date)
- Include code examples with proper syntax highlighting
- Add relevant tags for categorization
- Use descriptive titles and summaries

## Integration with Main Website

The blog is designed to integrate seamlessly with the main SUDOPOWER website:

- Shared CSS and JavaScript assets
- Consistent terminal aesthetic
- Navigation integration
- SEO optimization

## Performance

- **Build Time**: ~15ms for full site generation
- **Page Load**: Static files served from CDN
- **Image Optimization**: Automatic resizing and compression
- **Minification**: CSS and JS minified in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `hugo server`
5. Submit a pull request

## License

This blog theme and content are part of the SUDOPOWER project.
