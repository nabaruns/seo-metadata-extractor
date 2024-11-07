function getMetadata() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) return;
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const getMetaTags = (nameOrProperty) => {
          const byName = Array.from(document.querySelectorAll(`meta[name="${nameOrProperty}"]`));
          const byProperty = Array.from(document.querySelectorAll(`meta[property="${nameOrProperty}"]`));
          return [...byName, ...byProperty].map(tag => tag.content).join(', ');
        };

        const ogTags = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(tag => {
          const property = tag.getAttribute('property').replace('og:', '');
          ogTags[property] = tag.content;
        });

        const twitterTags = {};
        document.querySelectorAll('meta[name^="twitter:"]').forEach(tag => {
          const name = tag.getAttribute('name').replace('twitter:', '');
          twitterTags[name] = tag.content;
        });

        const keywords = [
          getMetaTags('keywords'),
          getMetaTags('article:tag'),
          getMetaTags('news_keywords'),
          Array.from(document.querySelectorAll('a[rel="tag"]'))
            .map(tag => tag.textContent)
            .join(', ')
        ].filter(Boolean).join(', ');

        return {
          title: document.title,
          description: getMetaTags('description'),
          keywords,
          h1Tags: Array.from(document.querySelectorAll('h1'))
            .map(h1 => h1.innerText),
          ogTags,
          twitterTags
        };
      },
    }, (results) => {
      if (results?.[0]?.result) {
        const { title, description, keywords, h1Tags, ogTags, twitterTags } = results[0].result;
        
        // Update basic elements
        document.getElementById('title').textContent = title;
        document.getElementById('description').textContent = description;
        document.getElementById('keywords').textContent = keywords;
        document.getElementById('h1-tags').textContent = h1Tags.join(', ');

        // Add Open Graph metadata
        const ogContainer = document.createElement('div');
        ogContainer.innerHTML = `
          <p><strong>Open Graph Tags:</strong></p>
          <ul id="og-tags">
            ${Object.entries(ogTags).map(([key, value]) => `
              <li>${key}: ${value}
                <button data-copy="og-${key}">Copy</button>
              </li>
            `).join('')}
          </ul>
        `;
        document.getElementById('metadata').appendChild(ogContainer);

        // Add Twitter Card metadata
        const twitterContainer = document.createElement('div');
        twitterContainer.innerHTML = `
          <p><strong>Twitter Card Tags:</strong></p>
          <ul id="twitter-tags">
            ${Object.entries(twitterTags).map(([key, value]) => `
              <li>${key}: ${value}
                <button data-copy="twitter-${key}">Copy</button>
              </li>
            `).join('')}
          </ul>
        `;
        document.getElementById('metadata').appendChild(twitterContainer);

        // Add hidden elements for copying
        Object.entries(ogTags).forEach(([key, value]) => {
          const element = document.createElement('span');
          element.id = `og-${key}`;
          element.style.display = 'none';
          element.textContent = value;
          document.body.appendChild(element);
        });

        Object.entries(twitterTags).forEach(([key, value]) => {
          const element = document.createElement('span');
          element.id = `twitter-${key}`;
          element.style.display = 'none';
          element.textContent = value;
          document.body.appendChild(element);
        });

        // Add event listeners to the newly created buttons
        document.querySelectorAll('[data-copy]').forEach(button => {
          button.addEventListener('click', () => {
            copyToClipboard(button.dataset.copy);
          });
        });
      }
    });
  });
}

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  getMetadata();
  
  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", () => {
      copyToClipboard(button.dataset.copy);
    });
  });
});
