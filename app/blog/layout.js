// Blog lives OUTSIDE the (public) route group (spec fixes the paths as
// app/blog/*), but it is public marketing surface — wrap in the same
// Header/Footer/StickyCallButton chrome the (public) layout uses.
import PublicChrome from '../../src/PublicChrome';

export default function BlogLayout({ children }) {
  return <PublicChrome>{children}</PublicChrome>;
}
