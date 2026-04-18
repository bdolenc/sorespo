import type { Component } from 'svelte';

import type { ValidationResult } from '$lib/core/validation/types';

export interface ServiceListItem {
  id: string;
  label: string;
  description?: string;
}

export interface ServiceModule<TDraft = unknown> {
  id: string;
  title: string;
  collectionLabel: string;
  description: string;
  deletable?: boolean;
  collectionRestconfRoot?: string;
  restconfRoot: string;
  keyParam: string;
  createDraft(): TDraft;
  parse(input: unknown): TDraft;
  list?(input: unknown): ServiceListItem[];
  validate(draft: TDraft): ValidationResult;
  serialize(draft: TDraft): unknown;
  getKey?(draft: TDraft): string;
  Editor: Component<{ draft: TDraft; errors: Record<string, string>; validationKey?: number }>;
  Summary?: Component<{ draft: TDraft }>;
  Preview?: Component<{ draft: TDraft; payload: unknown }>;
}

export function getDraftKey<TDraft>(module: ServiceModule<TDraft>, draft: TDraft): string {
  if (module.getKey) {
    return module.getKey(draft).trim();
  }

  const value = (draft as Record<string, unknown>)[module.keyParam];
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value);
}

export type AnyServiceModule = ServiceModule<any>;

export interface ServiceModuleMeta {
  id: string;
  title: string;
  collectionLabel: string;
  description: string;
}
