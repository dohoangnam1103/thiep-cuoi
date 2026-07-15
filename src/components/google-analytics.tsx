import { GOOGLE_ANALYTICS_ID } from "@/lib/analytics";

export function GoogleAnalytics() {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
      />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          var analyticsUrl = new URL(window.location.href);
          analyticsUrl.searchParams.delete('g');
          analyticsUrl.searchParams.delete('published');
          analyticsUrl.pathname = analyticsUrl.pathname
            .replace(new RegExp('^/thiep/[^/]+'), '/thiep/invitation')
            .replace(new RegExp('^/editor/[^/]+'), '/editor/invitation')
            .replace(new RegExp('^/dashboard/[^/]+'), '/dashboard/invitation');
          window.gtag('config', '${GOOGLE_ANALYTICS_ID}', {
            page_location: analyticsUrl.href,
            page_path: analyticsUrl.pathname + analyticsUrl.search,
            page_title: window.location.pathname.indexOf('/thiep/') === 0
              ? 'Thiệp cưới | Thiệp Mừng Online'
              : document.title
          });

          if (!window.__thiepMungAnalyticsBound) {
            window.__thiepMungAnalyticsBound = true;
            var sendElementEvent = function(element) {
              if (!element || !element.dataset.gaEvent) return;
              var params = { transport_type: 'beacon' };
              Array.prototype.forEach.call(element.attributes, function(attribute) {
                var prefix = 'data-ga-param-';
                if (attribute.name.indexOf(prefix) !== 0) return;
                var key = attribute.name.slice(prefix.length).replace(/-/g, '_');
                params[key] = attribute.value === 'true'
                  ? true
                  : attribute.value === 'false'
                    ? false
                    : attribute.value;
              });
              window.gtag('event', element.dataset.gaEvent, params);
            };
            document.addEventListener('click', function(event) {
              var element = event.target && event.target.closest
                ? event.target.closest('[data-ga-event]')
                : null;
              if (element && element.tagName !== 'FORM') sendElementEvent(element);
            });
            document.addEventListener('submit', function(event) {
              if (event.target && event.target.tagName === 'FORM') sendElementEvent(event.target);
            });

            var sendViewEvent = function(element) {
              if (!element || element.dataset.gaViewSent === 'true') return;
              element.dataset.gaViewSent = 'true';
              var params = {};
              try {
                params = JSON.parse(element.dataset.gaViewParams || '{}');
              } catch (_) {}
              params.transport_type = 'beacon';
              window.gtag('event', element.dataset.gaViewEvent, params);
              if (element.dataset.gaAdditionalEvent) {
                window.gtag('event', element.dataset.gaAdditionalEvent, params);
              }
              if (element.dataset.gaCleanQueryParam) {
                var url = new URL(window.location.href);
                url.searchParams.delete(element.dataset.gaCleanQueryParam);
                window.history.replaceState(
                  window.history.state,
                  '',
                  url.pathname + url.search + url.hash
                );
              }
            };
            var scanViewEvents = function(root) {
              if (root.matches && root.matches('[data-ga-view-event]')) sendViewEvent(root);
              if (root.querySelectorAll) {
                Array.prototype.forEach.call(
                  root.querySelectorAll('[data-ga-view-event]'),
                  sendViewEvent
                );
              }
            };
            scanViewEvents(document);
            new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                Array.prototype.forEach.call(mutation.addedNodes, function(node) {
                  if (node.nodeType === 1) scanViewEvents(node);
                });
              });
            }).observe(document.documentElement, { childList: true, subtree: true });
          }
        `,
        }}
      />
    </>
  );
}
