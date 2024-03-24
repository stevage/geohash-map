<script setup></script>

<template lang="pug">
#WikiPage
  .loading.i(v-if="loading") ...loading graticule description...
  .wiki(v-else v-html="pageContent")
</template>

<script>
export default {
    props: ['pageId'],
    data: () => ({ pageContent: null, loading: false }),
    created() {
        window.WikiPage = this;
    },
    watch: {
        pageId: {
            immediate: true,
            async handler() {
                this.pageContent = null;
                this.loading = true;
                if (this.pageId) {
                    const raw = await fetch(
                        // `https://geohashing.site/api.php?action=parse&page=${this.p.id}&format=json`
                        `https://fippe-geojson.glitch.me/wiki/?action=parse&page=${this.pageId}&format=json`
                    ).then((res) => {
                        return res.json();
                    });
                    // debugger;

                    this.pageContent = raw.parse.text['*']
                        .replace(
                            /\/geohashing\/File/g,
                            'https://geohashing.site/geohashing/File'
                        )
                        .replace(
                            /\/geohashing\/Image/g,
                            'https://geohashing.site/geohashing/Image'
                        )
                        .replace(
                            /([" ])\/images\//g,
                            '$1https://geohashing.site/images/'
                        )
                        .replace(/<a /g, '<a target="_blank" ')
                        .replace(/href="\//g, 'href="https://geohashing.site/')
                        .replace(/<p><br \/>\n<\/p>/gm, '');

                    this.loading = false;
                }
            },
        },
    },
};
</script>

<style>
.wiki .mw-parser-output table.infobox {
    display: none;
}

.wiki h2 {
    font-size: 14px;
    margin: 0;
}
.wiki h3,
.wiki h4 {
    font-size: 14px;
    margin: 0;
}

.wiki .mw-editsection {
    display: none;
}

.wiki p,
.wiki li,
.wiki {
    font-size: 12px;
}
.wiki {
    font-family: Cambria;
}
.wiki p {
    margin-top: 0;
    font-family: Cambria, serif;
    line-height: 1.5;
}

.wiki #toc {
    display: none;
}

.wiki {
    background: hsl(0, 0%, 18%);
    padding: 10px;
}

.wiki ul {
    list-style: none;
    padding: 0;
}

.wiki ul.gallery {
    list-style: none;
    padding: 0;
}

.wiki .gallerybox .thumb div {
    margin: 0 !important;
}

.wiki .gallerybox,
.wiki .gallerybox div {
    width: unset !important;
}

.wiki img {
    max-width: 100% !important;
    max-height: 170px !important;
    object-fit: cover;
}
</style>
