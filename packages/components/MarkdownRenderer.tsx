// import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import ReactMarkdown, { Components } from 'react-markdown'
import removeComments from 'remark-remove-comments'
import rehypeRaw from 'rehype-raw'
import remarkGFM from 'remark-gfm'
import remarkLink from 'remark-inline-links'
import remarkDefsplit from 'remark-defsplit'
import rehypeSanitize from 'rehype-sanitize'
import remarkHTML from 'remark-html'

import { Node } from 'unist'
import { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import { Element } from 'hast'

import './Markdown.css'
import { Picture } from './svg'

export const markdownComponents: Components = {
    img({ ...props }) {
        return <img style={{ maxWidth: "100%" }} {...props} />
    },
    // pre: <pre></pre>,
    // p: <p style={{fontSize: '1.125rem'}}></p>
}


function testSequence(elements: Element[], testTags: string[]) {
    const tags = elements.map(e => e.tagName)

    if (tags.length < testTags.length)
        return false;

    for (let i = 0; i < tags.length && i < testTags.length; i++) {
        if (tags[i] !== testTags[i])
            return false
    }
    return true
}


function featureTemplateTransformer(tree: Node) {
    visit(tree, (node, idx, parent) => {
        if (node.type !== 'element')
            return
        const element = node as Element

        if (element.tagName !== 'div')
            return

        const nonLineBreak = element.children.filter(n => {
            return n.type !== 'text'
        }) as Element[]

        if (!testSequence(nonLineBreak, ['h1', 'img', 'p']))
            return

        element.properties = { ...element.properties, className: "markdownFeatureTemplate" }

        const headerIdx = element.children.findIndex(n => n.type === 'element' && n.tagName === 'h1')
        const header = element.children[headerIdx]

        const picture = Picture({ fill: 'var(--accent2)' })

        element.children[headerIdx] = {
            type: 'element',
            tagName: 'div',
            children: [
                {
                    type: 'element',
                    tagName: picture?.type ?? '',
                    properties: picture?.props ?? '',
                    children: picture?.props.children
                },
                header
            ],
            properties: {className: 'markdownFeatureTemplateHeader'}
        }
    })
}


function featureTemplate() {
    return featureTemplateTransformer
}


export default function MarkdownRenderer({ children, ...props }: any) {
    return <ReactMarkdown components={markdownComponents} remarkPlugins={[removeComments, remarkGFM, remarkLink, remarkDefsplit]} rehypePlugins={[rehypeRaw, rehypeSanitize, featureTemplate]} style={{ ...props.style }} {...props}>
        {children}
    </ReactMarkdown>
}