"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { TagPill } from "@/components/tag-pill";
import type { ContentFilters, ContentSource, Tag, Topic } from "@/lib/types";

interface NewsFilterBarProps {
  basePath?: string;
  filters: ContentFilters;
  topics: Topic[];
  sources: ContentSource[];
  tags: Tag[];
}

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  label: string;
  placeholder: string;
  activeValue?: string;
  activeLabel?: string;
  options: FilterOption[];
  onSelect: (value?: string) => void;
}

const TOPIC_SEARCH_THRESHOLD = 6;
const SOURCE_SEARCH_THRESHOLD = 6;
const TAG_SEARCH_THRESHOLD = 10;

function buildHref(basePath: string, current: ContentFilters, updates: Partial<ContentFilters>) {
  const next = { ...current, ...updates };
  const params = new URLSearchParams();

  if (next.topic) params.set("topic", next.topic);
  if (next.source) params.set("source", next.source);
  if (next.tag) params.set("tag", next.tag);
  if (next.type) params.set("type", next.type);
  if (next.q) params.set("q", next.q);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function buildTopicHref(basePath: string, current: ContentFilters, topicSlug: string) {
  const params = new URLSearchParams();
  if (current.source) params.set("source", current.source);
  if (current.tag) params.set("tag", current.tag);
  if (current.type) params.set("type", current.type);
  if (current.q) params.set("q", current.q);

  if (basePath.startsWith("/news/") && basePath !== "/news") {
    const query = params.toString();
    return query ? `/news/${topicSlug}?${query}` : `/news/${topicSlug}`;
  }

  return buildHref(basePath, current, { topic: current.topic === topicSlug ? undefined : topicSlug });
}

function SearchFilter({ label, placeholder, activeValue, activeLabel, options, onSelect }: SearchFilterProps) {
  const [query, setQuery] = useState(activeLabel ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = options.filter((option) => !normalizedQuery || option.label.toLowerCase().includes(normalizedQuery)).slice(0, 6);

  useEffect(() => {
    setQuery(activeLabel ?? "");
  }, [activeLabel]);

  return (
    <div className="filter-search">
      <label className="filter-label" htmlFor={`filter-${label.toLowerCase()}`}>
        {label}
      </label>
      <div className="filter-search-control">
        <input
          id={`filter-${label.toLowerCase()}`}
          className="filter-search-input"
          type="search"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            const exactMatch = options.find((option) => option.label.toLowerCase() === normalizedQuery);
            const fallbackMatch = visibleOptions[0];
            const nextValue = exactMatch?.value ?? fallbackMatch?.value;

            if (nextValue) {
              onSelect(activeValue === nextValue ? undefined : nextValue);
              return;
            }

            if (!normalizedQuery) {
              onSelect(undefined);
            }
          }}
        />
        {activeValue ? (
          <button type="button" className="filter-clear" onClick={() => onSelect(undefined)}>
            Clear
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="filter-search-results">
          {visibleOptions.length ? (
            visibleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`filter-option${activeValue === option.value ? " is-active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(activeValue === option.value ? undefined : option.value);
                  setQuery(option.label);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {activeValue === option.value ? <small>Selected</small> : null}
              </button>
            ))
          ) : (
            <p className="filter-search-empty">No matches</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function NewsFilterBar({ basePath = "/news", filters, topics, sources, tags }: NewsFilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");
  const topicOptions = topics.map((topic) => ({ value: topic.slug, label: topic.name }));
  const sourceOptions = sources.map((source) => ({ value: source.slug, label: source.name }));
  const tagOptions = tags.map((tag) => ({ value: tag.slug, label: tag.label }));
  const activeTopic = topics.find((topic) => topic.slug === filters.topic || basePath === `/news/${topic.slug}`);
  const activeSource = sources.find((source) => source.slug === filters.source);
  const activeTag = tags.find((tag) => tag.slug === filters.tag);

  useEffect(() => {
    setQuery(filters.q ?? "");
  }, [filters.q]);

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  const updateFilters = (updates: Partial<ContentFilters>) => {
    navigate(buildHref(basePath, filters, updates));
  };

  return (
    <div className="filter-shell card">
      <div className="filter-head">
        <div>
          <p className="eyebrow">Filters</p>
          <h3>Find signals faster.</h3>
          <p className="section-description">Use quick chips for short lists. Bigger lists switch to search.</p>
        </div>
        <Link href={basePath} className="button-link">
          Reset filters
        </Link>
      </div>

      <form
        className="filter-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          updateFilters({ q: query.trim() || undefined });
        }}
      >
        <label className="filter-label" htmlFor={`keyword-${basePath.replace(/\W/g, "-")}`}>
          Search
        </label>
        <div className="filter-search-control">
          <input
            id={`keyword-${basePath.replace(/\W/g, "-")}`}
            className="filter-search-input"
            type="search"
            placeholder="Search titles, notes, or publishers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Apply</button>
        </div>
      </form>

      <div className="filter-group">
        <span className="filter-label">Topics</span>
        {topics.length > TOPIC_SEARCH_THRESHOLD ? (
          <SearchFilter
            label="Topic"
            placeholder="Search topics"
            activeValue={activeTopic?.slug}
            activeLabel={activeTopic?.name}
            options={topicOptions}
            onSelect={(value) => {
              if (!value) {
                if (basePath.startsWith('/news/') && basePath !== '/news') {
                  navigate(buildHref('/news', filters, { topic: undefined }));
                  return;
                }

                navigate(buildHref(basePath, filters, { topic: undefined }));
                return;
              }

              navigate(buildTopicHref(basePath, filters, value));
            }}
          />
        ) : (
          <div className="filter-row">
            {topics.map((topic) => (
              <TagPill
                key={topic.id}
                label={topic.name}
                href={buildTopicHref(basePath, filters, topic.slug)}
                isActive={filters.topic === topic.slug || basePath === `/news/${topic.slug}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="filter-group">
        <span className="filter-label">Type</span>
        <div className="filter-row compact-row">
          {[
            { label: "Blogs", value: "blog" as const },
            { label: "News", value: "news" as const }
          ].map((item) => (
            <TagPill
              key={item.value}
              label={item.label}
              href={buildHref(basePath, filters, { type: filters.type === item.value ? undefined : item.value })}
              isActive={filters.type === item.value}
            />
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Sources</span>
        {sources.length > SOURCE_SEARCH_THRESHOLD ? (
          <SearchFilter
            label="Source"
            placeholder="Search sources"
            activeValue={activeSource?.slug}
            activeLabel={activeSource?.name}
            options={sourceOptions}
            onSelect={(value) => updateFilters({ source: value })}
          />
        ) : (
          <div className="filter-row">
            {sources.map((source) => (
              <TagPill
                key={source.id}
                label={source.name}
                href={buildHref(basePath, filters, { source: filters.source === source.slug ? undefined : source.slug })}
                isActive={filters.source === source.slug}
              />
            ))}
          </div>
        )}
      </div>

      <div className="filter-group">
        <span className="filter-label">Tags</span>
        {tags.length > TAG_SEARCH_THRESHOLD ? (
          <SearchFilter
            label="Tag"
            placeholder="Search tags"
            activeValue={activeTag?.slug}
            activeLabel={activeTag?.label}
            options={tagOptions}
            onSelect={(value) => updateFilters({ tag: value })}
          />
        ) : (
          <div className="filter-row">
            {tags.map((tag) => (
              <TagPill
                key={tag.slug}
                label={tag.label}
                href={buildHref(basePath, filters, { tag: filters.tag === tag.slug ? undefined : tag.slug })}
                isActive={filters.tag === tag.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

