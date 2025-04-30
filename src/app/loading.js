import SiteLoader from '../app/components/loader/SiteLoader';

export default function Loading() {
  return <SiteLoader logoSrc="/logo.svg" duration={2000} />;
}