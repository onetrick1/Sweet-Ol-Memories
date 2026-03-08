"use client";

import posthog from "posthog-js";
import { PostHogProvider as OriginalPostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
		// Enable debug mode in development
		loaded: (posthog) => {
			if (process.env.NODE_ENV === "development") posthog.debug();
		},
		capture_pageview: false, // We'll manually capture pageviews
	});
}

export function PostHogPageview(): null {
	useEffect(() => {
		// Track pageview
		posthog.capture("$pageview");
	}, []);

	return null;
}

export default function PostHogProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<OriginalPostHogProvider client={posthog}>
			{children}
		</OriginalPostHogProvider>
	);
}
