import{_ as s,o as n,c as a,a as o}from"./app.4370c4cc.js";const C=JSON.parse('{"title":"Item actions","description":"","frontmatter":{},"headers":[],"relativePath":"guide/models/item-actions.md"}'),l={name:"guide/models/item-actions.md"},p=o(`<h1 id="item-actions" tabindex="-1">Item actions <a class="header-anchor" href="#item-actions" aria-hidden="true">#</a></h1><p>Sometimes CRUD is not enough. For those situations use <code>itemActions</code></p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> todo </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">defineModel</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">schema</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">title</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#F07178;">type</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> String </span><span style="color:#89DDFF;">},</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">completed</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#F07178;">type</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> Boolean </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">},</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">itemActions</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">toggle</span><span style="color:#89DDFF;">(</span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">            </span><span style="color:#89DDFF;">return</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">{</span><span style="color:#F07178;"> completed</span><span style="color:#89DDFF;">:</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">!</span><span style="color:#A6ACCD;">item</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">completed</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#F07178;">        </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">):</span></span>
<span class="line"></span></code></pre></div><p>Each item action will request an api route in the form <code>model/:id/action</code> so in the example it would be <code>todos/:id/toggle</code>.</p><p>The action will be added the model&#39;s store, that can be called with the id of the item you wish to trigger the action for</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> todoStore </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> vroom</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">stores</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">todo</span><span style="color:#A6ACCD;">()</span><span style="color:#89DDFF;">;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#A6ACCD;">todoStore</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">toggle</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">1</span><span style="color:#89DDFF;">&#39;</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"><span style="color:#676E95;">// Will call /todos/1/toggle</span></span>
<span class="line"></span></code></pre></div>`,6),e=[p];function t(c,r,D,y,F,i){return n(),a("div",null,e)}const d=s(l,[["render",t]]);export{C as __pageData,d as default};
