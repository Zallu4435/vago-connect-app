"use client";
import { useState, useLayoutEffect, RefObject } from 'react';

type PlacementInfo = 'top' | 'bottom';
type AlignInfo = 'left' | 'center' | 'right';

interface PopoverPositionProps {
    open: boolean;
    anchorRef: RefObject<HTMLElement | null>;
    popoverRef: RefObject<HTMLElement | null>;
    placement?: PlacementInfo;
    align?: AlignInfo;
    gap?: number;
}

export function usePopoverPosition({ open, anchorRef, popoverRef, placement = 'top', align = 'center', gap = 8 }: PopoverPositionProps) {
    const [coords, setCoords] = useState({ top: 0, left: 0, visibility: 'hidden' });

    useLayoutEffect(() => {
        if (!open) {
            setCoords(c => ({ ...c, visibility: 'hidden' }));
            return;
        }

        const position = () => {
            const anchor = anchorRef?.current;
            const popover = popoverRef?.current;
            if (!anchor || !popover) return;

            const rect = anchor.getBoundingClientRect();
            const popoverRect = popover.getBoundingClientRect();

            let top = 0;
            let left = 0;

            // Using fixed positioning relative to viewport
            if (placement === 'top') {
                top = rect.top - popoverRect.height - gap;
                // Flip to bottom if it goes off top edge
                if (top < gap) {
                    top = rect.bottom + gap;
                }
            } else if (placement === 'bottom') {
                top = rect.bottom + gap;
                // Flip to top if it goes off bottom edge
                if (rect.bottom + popoverRect.height > window.innerHeight - gap) {
                    top = rect.top - popoverRect.height - gap;
                }
            }

            // Handle alignment
            if (align === 'center') {
                left = rect.left + (rect.width / 2) - (popoverRect.width / 2);
            } else if (align === 'right') {
                // Ensure the right edge of popover aligns with the right edge of the button
                left = rect.right - popoverRect.width;
            } else if (align === 'left') {
                left = rect.left;
            }

            // Constrain horizontal to viewport bounds securely
            if (left < gap) left = gap;
            if (left + popoverRect.width > window.innerWidth - gap) {
                left = window.innerWidth - popoverRect.width - gap;
            }

            setCoords({ top, left, visibility: 'visible' });
        };

        setCoords(c => ({ ...c, visibility: 'hidden' }));
        const id = requestAnimationFrame(position);

        window.addEventListener("resize", position);
        window.addEventListener("scroll", position, true);

        return () => {
            cancelAnimationFrame(id);
            window.removeEventListener("resize", position);
            window.removeEventListener("scroll", position, true);
        };
    }, [open, anchorRef, popoverRef, placement, align, gap]);

    return coords;
}
