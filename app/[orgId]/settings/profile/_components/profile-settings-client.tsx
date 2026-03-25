"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import {
  ProfileSettingsSchema,
  type ProfileSettingsInput,
} from "@/lib/validations/profile-settings";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function listTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* ignore */
  }
  return ["UTC"];
}

function userMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: string }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "Something went wrong. Try again.";
}

export function ProfileSettingsClient() {
  const { data: sessionData, isPending, refetch } = authClient.useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);

  const timeZones = useMemo(() => listTimeZones(), []);

  const form = useForm<ProfileSettingsInput>({
    resolver: zodResolver(ProfileSettingsSchema),
    defaultValues: {
      name: "",
      email: "",
      timezone: "UTC",
      image: "",
    },
    mode: "onTouched",
  });

  const user = sessionData?.user;

  useEffect(() => {
    if (!user) return;
    const tz =
      (user as { timezone?: string | null }).timezone?.trim() || "UTC";
    form.reset({
      name: user.name ?? "",
      email: user.email ?? "",
      timezone: timeZones.includes(tz) ? tz : "UTC",
      image: user.image ?? "",
    });
  }, [user, form, timeZones]);

  async function onSubmit(values: ProfileSettingsInput) {
    setServerError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const initialEmail = user?.email?.toLowerCase() ?? "";
      const nextEmail = values.email.trim().toLowerCase();

      const messages: string[] = [];

      if (nextEmail !== initialEmail) {
        const changeRes = await authClient.changeEmail({
          newEmail: values.email.trim(),
          callbackURL:
            typeof window !== "undefined" ? window.location.href : undefined,
        });
        if (changeRes.error) {
          setServerError(userMessage(changeRes.error));
          return;
        }
        messages.push(
          "Check your inbox to confirm your new email address before it replaces the current one.",
        );
      }

      const imageVal = values.image?.trim() || null;

      const updateRes = await authClient.$fetch("/update-user", {
        method: "POST",
        body: {
          name: values.name.trim(),
          image: imageVal,
          timezone: values.timezone,
        },
      });

      if (updateRes.error) {
        setServerError(userMessage(updateRes.error));
        return;
      }

      messages.push("Profile saved.");
      setSuccess(messages.join(" "));
      await refetch();
    } catch (e) {
      setServerError(userMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (isPending && !user) {
    return (
      <div className="text-sm text-muted-foreground">Loading profile…</div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You need to be signed in to manage your profile.
        </AlertDescription>
      </Alert>
    );
  }

  const initials = user.name
    ?.split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const watchImage = form.watch("image");
  const previewSrc = watchImage?.trim() || user.image || "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage src={previewSrc} alt="" />
              <AvatarFallback className="rounded-lg text-lg">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              Photo uses a public image URL (same as your account avatar).
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your name" autoComplete="name" />
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
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormDescription>
                      Changing your email may send a confirmation link before it
                      updates.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Timezone</FormLabel>
                    <Popover open={tzOpen} onOpenChange={setTzOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={tzOpen}
                            className={cn(
                              "w-full justify-between font-normal md:max-w-md",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value || "Select timezone"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--radix-popover-trigger-width) p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Search timezone…" />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {timeZones.map((tz) => (
                                <CommandItem
                                  key={tz}
                                  value={tz}
                                  onSelect={() => {
                                    field.onChange(tz);
                                    setTzOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      tz === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {tz}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Used for how times are shown to you in the app.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile photo URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="https://…"
                        inputMode="url"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Clear the field to remove your profile image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    if (user) {
                      const tz =
                        (user as { timezone?: string | null }).timezone?.trim() ||
                        "UTC";
                      form.reset({
                        name: user.name ?? "",
                        email: user.email ?? "",
                        timezone: timeZones.includes(tz) ? tz : "UTC",
                        image: user.image ?? "",
                      });
                    }
                    setServerError(null);
                    setSuccess(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
