import { useEffect, useRef } from 'react';
import { Logger } from '@/utils/logger';

/**
 * A custom hook to track and log component renders and which props changed.
 * @param componentName The name of the component being tracked.
 * @param props The props of the component.
 */
export function useRenderLog(componentName: string, props: any = {}) {
    const renderCount = useRef(0);
    const prevProps = useRef(props);

    renderCount.current += 1;

    useEffect(() => {
        const changes: Record<string, { from: any; to: any }> = {};

        Object.keys(props).forEach((key) => {
            if (prevProps.current[key] !== props[key]) {
                changes[key] = {
                    from: prevProps.current[key],
                    to: props[key],
                };
            }
        });

        if (Object.keys(changes).length > 0) {
            Logger.debug(`[RenderLog] ${componentName} rendered (#${renderCount.current}) due to changes:`, changes);
        } else if (renderCount.current > 1) {
            Logger.debug(`[RenderLog] ${componentName} rendered (#${renderCount.current}) - No props changed (Potential unnecessary re-render)`);
        } else {
            Logger.debug(`[RenderLog] ${componentName} initial render (#${renderCount.current})`);
        }

        prevProps.current = props;
    });
}
