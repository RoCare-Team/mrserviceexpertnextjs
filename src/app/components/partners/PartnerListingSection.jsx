import Link from "next/link";
import { Users } from "lucide-react";
import PartnerCard from "./PartnerCard";
import PartnerLoadMore from "./PartnerLoadMore";
import { getPagePartners } from "./pagePartners";
import { SectionHeader } from "@/app/components/public/ui";

/**
 * Server component: the full grid of approved partners for a service page.
 * Pass `data` from getPagePartners() when the page already fetched it (the
 * sticky sidebar shares the same query); otherwise it fetches itself.
 * Renders nothing when there are no partners, so pages look the same until
 * someone is approved for that area.
 */
export default function PartnerListingSection(props) {
  if (props.data !== undefined) return <Listing data={props.data} />;
  return <ListingFetch {...props} />;
}

async function ListingFetch(props) {
  const data = await getPagePartners(props);
  return <Listing data={data} />;
}

function Listing({ data }) {
  if (!data?.first?.total) return null;
  const { ids, first, bookingContext, cityName, categoryName } = data;
  return (
    <section id="partners" aria-labelledby="partners-h" className="scroll-mt-24">
      <SectionHeader
        id="partners-h"
        eyebrow="Approved partners"
        title={`${categoryName} service partners in ${cityName}`}
        subtitle={`Independent businesses approved by Mr. Service Expert that serve ${cityName}.`}
        action={
          <Link href="/join-as-partner" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline">
            <Users className="h-4 w-4" aria-hidden="true" /> Join as a partner
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {first.items.map((p) => (
          <li key={p.slug}>
            <PartnerCard partner={p} bookingContext={bookingContext} />
          </li>
        ))}
        {first.hasMore && <PartnerLoadMore query={ids} startPage={2} bookingContext={bookingContext} />}
      </ul>
    </section>
  );
}
