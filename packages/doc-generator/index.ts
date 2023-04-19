import * as fs from 'fs';
import * as path from 'path';
import { BundleSchema, HTTPResponses, MetaDataSchema, MinecraftVersionSchema, PackCategorySchema, PackDataSchema, PackReferenceSchema, PackVersionSchema, SortSchema, UserDataSchema } from 'data-types'
import { TProperties, TObject, TArray, TSchema, Kind, Modifier, TUnion, TLiteral, TLiteralValue } from '@sinclair/typebox';

interface Config {
    targets: string[],
    extensions: RegExp,
    outDir: string
}

interface Directive {
    pattern: string | RegExp
    template: (groups: string[]) => string
}

const defaultVariableTemplate = (groups: string[]) => {
    let type = groups[1]


    const typeMatch = type.matchAll(/([^\[\?]+)(.*)+/g).next()

    if (!['string','number','boolean'].includes(typeMatch.value[1])) {
        const schema = registeredSchemas.find(r => r.name === typeMatch.value[1])
        console.log(schema)
        if (schema !== undefined)
            type = `[${typeMatch.value[1]}](/api/data-types)${typeMatch.value[2]}`
    }

    return `{bdg-dark}\`${groups[0]}\` <label class="sd-text-secondary">${type}</label>${groups[2]}\n`
}
const HDIV = `\n<div class='sd-bg-secondary' style='width: 95%; height: 1px; margin: 0em 0em 0.1em 0em'></div>\n`

const POSSIBLE_DIRECTIVES: { [key: string]: Directive } = {
    'route': {
        pattern: /@route (.+) (.+)((\s*.*)+)/g,
        template: (groups) => `### {bdg-success}\`${groups[0]}\`\n${groups[2]}`
    },
    'query': {
        pattern: /@query ([^:]+):\s*(.+)((\s*.*)+)/g,
        template: defaultVariableTemplate
    },
    'return': {
        pattern: /@return ([^:]+):\s*(.+)/g,
        template: (groups) => `{bdg-primary}\`${groups[0]} - ${HTTPResponses[groups[0] as keyof typeof HTTPResponses]}\` <label class="sd-text-secondary">${groups[1]}</label>\n`
    },
    'example': {
        pattern: /@example (.+)((\s.*)+)/g,
        template: (groups) =>
            `::::{admonition} ${groups[0]}
    :class: note        
\`\`\`ts${groups[1]}
\`\`\`
::::\n`
    },
    'param': {
        pattern: /@param (.+)((\s*.*)+)/g,
        template: (groups) => `**${groups[0]}**:${groups[1]}`
    },
    'body': {
        pattern: /@body ([^:]+):\s*(.+)((\s*.*)+)/g,
        template: defaultVariableTemplate
    }
}






const COMMENT_BLOCK = /\/\*(\s*\*.*)*\s+\*\//g
const DIRECTIVE = /(@\w+)(.+)?(\s(?!@\w).+)*/g

function parseDirective(content: string): [string, string[]] {
    for (const name in POSSIBLE_DIRECTIVES) {
        const d = POSSIBLE_DIRECTIVES[name]
        const match = content.matchAll(d.pattern instanceof RegExp ? d.pattern : new RegExp(d.pattern, 'g')).next()
        if (match.done)
            continue

        const groups = match.value.slice(1)
        return [name, groups]
    }
    return ['none', [content]]
}

const files: { [key: string]: string } = {}

function generateDirectives(type: string, directives: { [key: string]: string[][] }, header?: string) {
    if (directives[type] === undefined || directives[type].length === 0)
        return ''

    return (header !== undefined ? header + '\n' : '')
        + directives[type].map(groups => POSSIBLE_DIRECTIVES[type].template(groups)).join('\n')
}

function extract(t: string, config: Config) {
    const content = fs.readFileSync(t, { encoding: 'utf-8' })

    const blocks = content.matchAll(COMMENT_BLOCK)
    for (let [text, ...other] of blocks) {
        text = text.replace(/\s*(\/)?\*(\/)? ?/g, '\n')

        const directives = text.matchAll(DIRECTIVE)

        const parsedDirectives: { [key: string]: string[][] } = {}
        for (const [directiveContent, ...other] of directives) {
            const d = parseDirective(directiveContent)

            if (parsedDirectives[d[0]] === undefined)
                parsedDirectives[d[0]] = []

            parsedDirectives[d[0]].push(d[1])
        }

        let extractedDoc = [
            generateDirectives('route', parsedDirectives),
            generateDirectives('param', parsedDirectives, '\n\n#### URL Parameters' + HDIV),
            generateDirectives('query', parsedDirectives, '\n\n#### Query Parameters' + HDIV),
            generateDirectives('body', parsedDirectives, '\n\n#### Body Parameters' + HDIV),
            generateDirectives('return', parsedDirectives, '\n\n#### Possible Responses' + HDIV),
            generateDirectives('example', parsedDirectives, '\n\n#### Examples' + HDIV),
            '<br/>\n\n'
        ].join('\n') + '\n'

        const routeGroup = parsedDirectives['route'][0]
        const route = routeGroup[1]

        const filePath = path.join(config.outDir, route.replaceAll(':', '') + '.md')


        if (files[filePath] === undefined)
            files[filePath] = '## ' + route + '\n' + extractedDoc
        else
            files[filePath] += extractedDoc
    }


}

function readDirectory(t: string, config: Config) {
    if (!fs.existsSync(t)) {
        console.log(`${t} does not exist`)
        return
    }
    const contents = fs.readdirSync(t, { withFileTypes: true })

    for (const c of contents) {
        if (c.isDirectory())
            readDirectory(path.join(t, c.name), config)
        if (c.isFile() && c.name.matchAll(config.extensions))
            extract(path.join(t, c.name), config)

    }

}



function propertyToNiceFormat(key: string, property: TSchema, level: number) {
    let indent = ' '.repeat(level * 2)

    let structure = key != '' ? `${indent}${key}: ` : ''

    const registeredSchema = registeredSchemas.find(r => r.value === property)
    if (registeredSchema !== undefined) {
        structure += `${registeredSchema.name}`
    } else if (property['type'] == 'object') {
        structure += '{\n'
        for (const key of Object.keys(property.properties)) {
            const value = property.properties[key]
            structure += propertyToNiceFormat(key, value, level + 1) + '\n'
        }
        structure += indent + "}"
    } else if (property['type'] == 'array') {
        structure += `${propertyToNiceFormat('', property.items, level)}[]`

    } else if (property[Kind] === 'Union') {
        structure += property.anyOf.map((p: TSchema) => propertyToNiceFormat('', p, level)).join(' | ')
    } else if (property[Kind] === 'Literal') {
        const value: TLiteralValue = property.const
        if (typeof value.valueOf() === 'string')
            structure += '\'' + value.valueOf() + '\''
        else
            structure += value.valueOf()
    } else {
        structure += `${property['type']}`
    }

    if (property[Modifier] === 'Optional')
        structure += '?'

    return structure
}

const registeredSchemas: { name: string, value: TSchema }[] = []
function schemaToNiceFormat(schema: TSchema, level: number = 1) {
    return propertyToNiceFormat('', schema, level)
}

function registerSchema(name: string, schema: TSchema) {
    const prettified = `### ${name}\n\`\`\`ts\n${schemaToNiceFormat(schema, 0)}\n\`\`\``
    registeredSchemas.push({ name: name, value: schema })
    return prettified
}

function start(config: Config) {
    if (fs.existsSync(config.outDir))
        fs.rmSync(config.outDir, { recursive: true, force: true })
    fs.mkdirSync(config.outDir)

    
    const dataTypes = [
        registerSchema('PackReference', PackReferenceSchema),
        registerSchema('PackCategory', PackCategorySchema),
        registerSchema('MinecraftVersion', MinecraftVersionSchema),
        registerSchema('PackVersion', PackVersionSchema),
        registerSchema('PackData', PackDataSchema),
        registerSchema('PackMetaData', MetaDataSchema),
        registerSchema('PackBundle', BundleSchema),
        registerSchema('UserData', UserDataSchema),
        registerSchema('SortOptions', SortSchema)
    ].join('\n')

    fs.writeFileSync(path.join(config.outDir, 'data-types.md'), dataTypes)

    for (const t of config.targets) {
        readDirectory(t, config)
    }

    const imports = []
    for (const file in files) {
        file.split(path.sep).forEach((cur, idx, arr) => {
            if (idx === arr.length - 1)
                return

            const part = arr.slice(0, idx + 1).join(path.sep);
            if (!fs.existsSync(part))
                fs.mkdirSync(part)
        })

        fs.writeFileSync(file, files[file])
        imports.push(path.join(path.basename(config.outDir), file.replace(path.normalize(config.outDir), '')).replaceAll(path.sep, '/'))
    }

    fs.writeFileSync(path.join(config.outDir, 'routes.md'), imports.map(i => `
\`\`\`{include} ${i}
\`\`\``).join('\n')
    )


}


if (fs.existsSync('./config.json')) {
    const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf-8' }))

    start(config)
}   