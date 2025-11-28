# SEO Quick Wins - Implementation Guide

## Priority Fixes for Immediate Impact

This guide provides ready-to-implement code for the highest-priority SEO improvements.

---

## 🚀 QUICK WIN #1: Add Organization Schema (15 minutes)

**Impact:** High - Enables rich snippets, improves brand recognition

**File:** `/app/layout.tsx`

Add this script tag before the closing `</body>` tag (around line 196):

```typescript
{/* Organization Schema */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${process.env.NEXT_PUBLIC_BASE_URL}/#organization`,
      name: "Le Bon Tempérament",
      alternateName: "BT",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      logo: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/logo",
      description: "Ensemble vocal et instrumental renommé à Saverne, France, depuis 1987",
      address: {
        "@type": "PostalAddress",
        streetAddress: "3 Rue Clemenceau",
        addressLocality: "Saverne",
        postalCode: "67700",
        addressCountry: "FR"
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+33-09-52-39-57-89",
        contactType: "customer service",
        email: "lebontemperament@gmail.com",
        areaServed: "FR",
        availableLanguage: "fr"
      },
      sameAs: [
        "https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/",
        "https://www.instagram.com/lebontemperament_",
        "https://www.youtube.com/@lebontemperament",
        "https://www.tiktok.com/@lebontemperament"
      ],
      foundingDate: "1987",
      founder: {
        "@type": "Person",
        name: "Simone Duclos"
      }
    })
  }}
/>
```

**Test:** Use [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 🚀 QUICK WIN #2: Add generateStaticParams for Concert Pages (10 minutes)

**Impact:** High - Faster page loads, better indexing

**File:** `/app/concerts/[slug]/page.tsx`

Add this function BEFORE the `generateMetadata` function (around line 8):

```typescript
export async function generateStaticParams() {
  const projects = await import("@/public/json/projects.json");
  return projects.default.map((project: { slug: string }) => ({
    slug: project.slug,
  }));
}
```

**Note:** This will pre-generate all concert pages at build time for better performance.

---

## 🚀 QUICK WIN #3: Fix Sitemap Dates (5 minutes)

**Impact:** Medium - Better content freshness signals

**File:** `/app/sitemap.ts`

Replace lines 68-73 with:

```typescript
const dynamicRoutes = projects.map(
  (project: { slug: string; date?: string }) => {
    // Use project date if available, otherwise use current date
    const lastModified = project.date
      ? new Date(project.date).toISOString()
      : new Date().toISOString();

    return {
      url: `${WEBSITE_URL}/concerts/${project.slug}`,
      lastModified,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.6,
    };
  },
);
```

---

## 🚀 QUICK WIN #4: Add LocalBusiness Schema (10 minutes)

**Impact:** High - Local search visibility

**File:** `/app/contact/page.tsx`

Add this before the closing `</div>` of the Contact component (around line 262):

```typescript
{/* LocalBusiness Schema */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${process.env.NEXT_PUBLIC_BASE_URL}/#localbusiness`,
      name: "Le Bon Tempérament",
      image: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/logo",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      telephone: "+33-09-52-39-57-89",
      email: "lebontemperament@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "3 Rue Clemenceau",
        addressLocality: "Saverne",
        addressRegion: "Alsace",
        postalCode: "67700",
        addressCountry: "FR"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "48.7417",
        longitude: "7.3622"
      },
      priceRange: "€€"
    })
  }}
/>
```

**Note:** Verify the geo coordinates are accurate for your location.

---

## 🚀 QUICK WIN #5: Enhance Concert Event Schema (15 minutes)

**Impact:** Medium-High - Better event discovery

**File:** `/app/concerts/[slug]/page.tsx`

Update the `generateStructuredData` function (lines 54-87) to include:

```typescript
function generateStructuredData(project: ConcertProject, slug: string) {
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${project.name} ${project.subName}`,
    description: project.explanation,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/${slug}`,
    startDate: project.date,
    organizer: {
      "@type": "Organization",
      name: "Le Bon Tempérament",
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    performer: {
      "@type": "MusicGroup",
      name: "Le Bon Tempérament",
      description: "Ensemble vocal et instrumental",
    },
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "fr-FR",
    location: {
      "@type": "Place",
      name: "Saverne, France",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Saverne",
        addressCountry: "FR",
      },
    },
    // ADD THESE NEW FIELDS:
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0", // Update with actual price if applicable
      priceCurrency: "EUR",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/contact`, // Link to booking
    },
    keywords: "musique classique, opéra, baroque, concert, Saverne, Alsace",
    audience: {
      "@type": "Audience",
      audienceType: "Tous publics",
    },
  };

  return eventSchema;
}
```

---

## 🚀 QUICK WIN #6: Add Breadcrumb Schema (10 minutes)

**Impact:** Medium - Better navigation understanding

**File:** `/components/Breadcrumb.tsx`

Add this function and script tag:

```typescript
// Add this function inside the Breadcrumb component, before return:
const generateBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${process.env.NEXT_PUBLIC_BASE_URL}${crumb.href}`
    }))
  };
};

// Then in the return statement, add before the <nav>:
{typeof window !== "undefined" && (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs))
    }}
  />
)}
```

**Note:** Since this is a client component, you'll need to handle the base URL differently. Consider moving breadcrumb schema to server component or using a different approach.

---

## 📋 Implementation Checklist

- [ ] Quick Win #1: Organization Schema
- [ ] Quick Win #2: generateStaticParams
- [ ] Quick Win #3: Fix Sitemap Dates
- [ ] Quick Win #4: LocalBusiness Schema
- [ ] Quick Win #5: Enhanced Event Schema
- [ ] Quick Win #6: Breadcrumb Schema

**Total Estimated Time:** ~65 minutes

**Expected Impact:**

- Improved rich snippet appearance
- Better local search visibility
- Faster page loads
- Enhanced event discovery
- Better search engine understanding

---

## 🧪 Testing After Implementation

1. **Google Rich Results Test:**
   - Test homepage: `https://search.google.com/test/rich-results`
   - Test contact page
   - Test a concert page

2. **Schema Markup Validator:**
   - Use [Schema.org Validator](https://validator.schema.org/)

3. **Google Search Console:**
   - Submit updated sitemap
   - Monitor for rich result enhancements

4. **Build Test:**
   - Run `npm run build` to ensure generateStaticParams works
   - Check that all pages build successfully

---

## 🎯 Next Steps After Quick Wins

Once these quick wins are implemented, proceed with:

1. **FAQ Page Creation** (See full audit report)
2. **Content Enhancement** (Homepage depth, concert pages)
3. **Advanced GEO Optimization** (Q&A formats, voice search)

Refer to `SEO_GEO_AUDIT_REPORT.md` for the complete roadmap.
