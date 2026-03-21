import type { FalconConnectConnectionDisplay } from '@falcon-framework/sdk/connect'
import { connectAppPublicOrigin } from '#/lib/connect-app-origins'

export function ConnectionListItem({ c }: { c: FalconConnectConnectionDisplay }) {
  const sourceOrigin = connectAppPublicOrigin(c.sourceAppId)
  const targetOrigin = connectAppPublicOrigin(c.targetAppId)

  return (
    <li className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3">
      <p className="m-0 font-semibold text-[var(--sea-ink)]">{c.line}</p>
      <p className="mt-1 m-0 text-xs text-[var(--sea-ink-soft)]">
        Status: <span className="capitalize">{c.status}</span>
      </p>
      {(sourceOrigin || targetOrigin) ? (
        <p className="mt-3 m-0 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {sourceOrigin ? (
            <a
              href={sourceOrigin}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--lagoon-deep)] underline underline-offset-2"
            >
              See in {c.sourceLabel}
            </a>
          ) : null}
          {targetOrigin ? (
            <a
              href={targetOrigin}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--lagoon-deep)] underline underline-offset-2"
            >
              See in {c.targetLabel}
            </a>
          ) : null}
        </p>
      ) : null}
    </li>
  )
}
