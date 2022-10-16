import{_ as s,o as a,c as n,a as t}from"./app.4370c4cc.js";const C=JSON.parse('{"title":"Actions and API mapping","description":"","frontmatter":{},"headers":[{"level":2,"title":"Setting plural name","slug":"setting-plural-name","link":"#setting-plural-name","children":[]},{"level":2,"title":"Custom path","slug":"custom-path","link":"#custom-path","children":[]},{"level":2,"title":"Omitting actions","slug":"omitting-actions","link":"#omitting-actions","children":[]}],"relativePath":"guide/models/api.md"}'),o={name:"guide/models/api.md"},l=t(`<h1 id="actions-and-api-mapping" tabindex="-1">Actions and API mapping <a class="header-anchor" href="#actions-and-api-mapping" aria-hidden="true">#</a></h1><p>Vroom autogenerates a list of api routes based on your model settings. And you have a few options for how it gets named.</p><p>As default the key you give the model, when setting up vroom will define the api routes</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> vroom </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">createVroom</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">models</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">todo</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">defineModel</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#89DDFF;">            </span><span style="color:#676E95;">//...</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"></span></code></pre></div><p>In this example <code>todo</code> will be used as the base for all api routes with naive pluralising <code>+&#39;s&#39;</code>. Vroom will automatically callers for the following api routes</p><table><thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead><tbody><tr><td>GET</td><td>/todos</td><td>List todos</td></tr><tr><td>POST</td><td>/todos</td><td>Create a todo</td></tr><tr><td>GET</td><td>/todos/:id</td><td>Get a single todo</td></tr><tr><td>PATCH</td><td>/todos/:id</td><td>Update a todo</td></tr><tr><td>DELETE</td><td>/todos/:id</td><td>Delete a todo</td></tr></tbody></table><h2 id="setting-plural-name" tabindex="-1">Setting plural name <a class="header-anchor" href="#setting-plural-name" aria-hidden="true">#</a></h2><p>By default Vroom will try to pluralise your model name by adding an <code>s</code>. You can customise the plural name like so:</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> vroom </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">createVroom</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">models</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">category</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">defineModel</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">            </span><span style="color:#F07178;">plural</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">categories</span><span style="color:#89DDFF;">&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"></span></code></pre></div><table><thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead><tbody><tr><td>GET</td><td>/categories</td><td>List categories</td></tr><tr><td>POST</td><td>/categories</td><td>Create a category</td></tr><tr><td>GET</td><td>/categories/:id</td><td>Get a single category</td></tr><tr><td>PATCH</td><td>/categories/:id</td><td>Update a category</td></tr><tr><td>DELETE</td><td>/categories/:id</td><td>Delete a category</td></tr></tbody></table><h2 id="custom-path" tabindex="-1">Custom path <a class="header-anchor" href="#custom-path" aria-hidden="true">#</a></h2><p>Overwrites the path of the base endpoint completely</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> vroom </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">createVroom</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">models</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">todo</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">defineModel</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">            </span><span style="color:#F07178;">path</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">/v2/todos</span><span style="color:#89DDFF;">&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"></span></code></pre></div><table><thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead><tbody><tr><td>GET</td><td>/v2/todos</td><td>List todos</td></tr><tr><td>POST</td><td>/v2/todos</td><td>Create a todo</td></tr><tr><td>GET</td><td>/v2/todos/:id</td><td>Get a single todo</td></tr><tr><td>PATCH</td><td>/v2/todos/:id</td><td>Update a todo</td></tr><tr><td>DELETE</td><td>/v2/todos/:id</td><td>Delete a todo</td></tr></tbody></table><h2 id="omitting-actions" tabindex="-1">Omitting actions <a class="header-anchor" href="#omitting-actions" aria-hidden="true">#</a></h2><p>You might not always need or want all actions, so you can specify which actions to create by providing an array of actions</p><div class="language-typescript"><button class="copy"></button><span class="lang">typescript</span><pre><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> vroom </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">createVroom</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#F07178;">models</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#F07178;">todo</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">defineModel</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#89DDFF;">            </span><span style="color:#676E95;">//...</span></span>
<span class="line"><span style="color:#A6ACCD;">            </span><span style="color:#F07178;">only</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> [</span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">index</span><span style="color:#89DDFF;">&#39;</span><span style="color:#89DDFF;">,</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">read</span><span style="color:#89DDFF;">&#39;</span><span style="color:#A6ACCD;">] </span><span style="color:#676E95;">// options: index, create, read, update, delete</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;">)</span></span>
<span class="line"></span></code></pre></div>`,17),p=[l];function e(r,c,d,i,y,D){return a(),n("div",null,p)}const F=s(o,[["render",e]]);export{C as __pageData,F as default};
