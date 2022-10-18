import{_ as s,o as a,c as n,a as o}from"./app.a2b9b989.js";const C=JSON.parse('{"title":"Adding custom filters","description":"","frontmatter":{},"headers":[],"relativePath":"guide/server/filters.md"}'),l={name:"guide/server/filters.md"},p=o(`<h1 id="adding-custom-filters" tabindex="-1">Adding custom filters <a class="header-anchor" href="#adding-custom-filters" aria-hidden="true">#</a></h1><p>See <a href="/vue-vroom/guide/fetching/filters.html">filtering lists</a> for basic filters</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#A6ACCD;">vroom</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">server</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">addFilters</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#F07178;">book</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#89DDFF;">    </span><span style="color:#676E95;">// Let&#39;s do a search that searches in title and author</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">search</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">,</span><span style="color:#A6ACCD;"> </span><span style="color:#A6ACCD;">value</span><span style="color:#89DDFF;">,</span><span style="color:#A6ACCD;"> </span><span style="color:#A6ACCD;">db</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#C792EA;">const</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">author</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">authorId</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">?</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">db</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">author</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">find</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">authorId</span><span style="color:#F07178;">) </span><span style="color:#89DDFF;">:</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">null;</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#89DDFF;">if</span><span style="color:#F07178;"> (</span><span style="color:#A6ACCD;">author</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">&amp;&amp;</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">author</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">name</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">toLowerCase</span><span style="color:#F07178;">()</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">includes</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">value</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">toLowerCase</span><span style="color:#F07178;">())) </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">        </span><span style="color:#89DDFF;">return</span><span style="color:#F07178;"> </span><span style="color:#FF9CAC;">true</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#F07178;">      </span><span style="color:#89DDFF;">return</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">title</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">toLowerCase</span><span style="color:#F07178;">()</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">includes</span><span style="color:#F07178;">(</span><span style="color:#A6ACCD;">value</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">toLowerCase</span><span style="color:#F07178;">())</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#F07178;">    </span><span style="color:#89DDFF;">},</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">},</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span><span style="color:#89DDFF;">;</span></span>
<span class="line"></span></code></pre></div><p>This will allow you to call <code>books?search=...</code></p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>Make sure to include this in a way where your bundler can ignore it in production. <a href="/vue-vroom/guide/intro/organization.html">See notes on organisation here</a>.</p></div>`,5),e=[p];function t(r,c,F,y,D,i){return a(),n("div",null,e)}const d=s(l,[["render",t]]);export{C as __pageData,d as default};