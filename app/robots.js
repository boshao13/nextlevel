// app/robots.js — serves /robots.txt, replacing the static public/robots.txt
// (deleted in this commit). Semantics identical: allow everything, keep
// crawlers out of the admin SPA, point at the generated sitemap.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/login'],
      },
    ],
    sitemap: 'https://www.nextlevelepoxynm.com/sitemap.xml',
  };
}
