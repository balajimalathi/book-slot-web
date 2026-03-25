"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { OrganizationOnboardingSchema } from "@/lib/validations/organization-onboarding";

const OnboardingOrgSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  slug: OrganizationOnboardingSchema.shape.slug,
  timezone: z.literal("UTC").default("UTC"),
});

type OnboardingOrgValues = z.infer<typeof OnboardingOrgSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OnboardingOrgValues>({
    resolver: zodResolver(OnboardingOrgSchema as never),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      slug: "",
      timezone: "UTC",
    },
    mode: "onTouched",
  });

  const slugSanitized = form.watch("slug");
  const normalizedSlug = useMemo(() => {
    const s = slugSanitized?.trim().toLowerCase() ?? "";
    // Keep the regex validation as the source of truth; this is just UX.
    return s.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }, [slugSanitized]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/onboarding/status", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) router.replace("/login");
          return;
        }

        const data = (await res.json()) as { onboarded?: boolean; orgId?: string | null };
        if (data.onboarded && data.orgId) {
          router.replace(`/${data.orgId}/dash`);
          return;
        }

        if (!cancelled) setServerError(null);
      } catch {
        if (!cancelled) setServerError("Failed to check onboarding status.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(values: OnboardingOrgValues) {
    setServerError(null);

    const res = await fetch("/api/onboarding/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        businessName: values.businessName,
        email: values.email,
        phone: values.phone,
        slug: values.slug,
        timezone: values.timezone,
      }),
    });

    const data = (await res.json().catch(() => null)) as
      | { error?: string; orgId?: string }
      | null;

    if (!res.ok || !data?.orgId) {
      setServerError(data?.error ?? "Onboarding failed.");
      return;
    }

    router.replace(`/${data.orgId}/dash`);
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="me@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="acme-inc"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                    {normalizedSlug && normalizedSlug !== field.value && (
                      <p className="text-xs text-muted-foreground">
                        Normalized: {normalizedSlug}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create organization
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

