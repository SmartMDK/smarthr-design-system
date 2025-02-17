import React, { VFC } from 'react'
import styled from 'styled-components'
import { Link, graphql, useStaticQuery } from 'gatsby'
import { Body, Cell, Head, Row, Table, Text } from 'smarthr-ui'
import { FragmentTitle } from '../../article/FragmentTitle/FragmentTitle'
import reactStringReplace from 'react-string-replace'
import { marked } from 'marked'

const query = graphql`
  query IdiomaticUsageTable {
    idiomaticUsageData: allAirtable(filter: { table: { eq: "用字用語：一覧" } }) {
      edges {
        node {
          data {
            label
            ng_example
            ok_example
            expected
            reason
            record_id
          }
        }
      }
    }
    idiomaticUsageReason: allAirtable(filter: { table: { eq: "用字用語：理由" } }) {
      edges {
        node {
          data {
            name
            description
            discussion
            source
            record_id
            data
          }
        }
      }
    }
    writingStyle: allAirtable(filter: { table: { eq: "基本的な考え方や表記" } }) {
      edges {
        node {
          data {
            name
            data
            record_id
          }
        }
      }
    }
  }
`

type Props = {
  type: 'data' | 'reason'
}

export const IdiomaticUsageTable: VFC<Props> = ({ type }) => {
  const data = useStaticQuery<GatsbyTypes.IdiomaticUsageTableQuery>(query)

  const idiomaticUsageData = data.idiomaticUsageData.edges
    .map(({ node }) => ({
      label: node.data?.label,
      ngExample: node.data?.ng_example,
      okExample: node.data?.ok_example,
      reason: node.data?.reason,
      recordId: node.data?.record_id,
    }))
    .sort((x, y) => (x.label && y.label ? x.label.localeCompare(y.label, 'ja') : -1))

  const idiomaticUsageReason = data.idiomaticUsageReason.edges
    .map(({ node }) => ({
      name: node.data?.name,
      description: marked.parse(node.data?.description || ''),
      discussion: node.data?.discussion,
      source: node.data?.source,
      recordId: node.data?.record_id,
      data: node.data?.data,
    }))
    .sort((x, y) => (x.name && y.name ? x.name.localeCompare(y.name, 'ja') : -1))

  const writingStyle = data.writingStyle.edges
    .map(({ node }) => ({
      name: node.data?.name,
      data: node.data?.data, // 用字用語：一覧からのデータ参照
      recordId: node.data?.record_id,
    }))
    .sort((x, y) => (x.name && y.name ? x.name.localeCompare(y.name, 'ja') : -1))

  const getReplaceLinkText = (text: string) => {
    return (
      <StyledText as="p">
        {reactStringReplace(text, /(https?:\/\/\S+)/g, (match: string, strIndex: number) => (
          <a key={strIndex} href={match}>
            {match}
          </a>
        ))}
      </StyledText>
    )
  }

  return (
    <>
      {type === 'data' && (
        <Wrapper>
          <Table>
            <Head>
              <Row>
                <RecommendCell>推奨する表記</RecommendCell>
                <NGCell>NG例</NGCell>
                <ReasonCell>理由</ReasonCell>
              </Row>
            </Head>
            <Body>
              {idiomaticUsageData.map((prop, index) => {
                const matchReason = idiomaticUsageReason.find((reason) => prop.reason && prop.reason.includes(reason.recordId))
                const matchWritingStyle = writingStyle.find((style) => style.data && style.data.includes(prop.recordId))

                // recordId: "recWCPX1UhchVaFjO"
                // "平仮名にしたほうが読みやすい漢字は平仮名にする"
                // console.log(writingStyle)

                return (
                  <Row key={index}>
                    <RecommendCell>
                      <strong>{prop.okExample}</strong>
                    </RecommendCell>
                    <NGCell>{prop.ngExample}</NGCell>
                    <ReasonCell>
                      <ul>
                        {matchWritingStyle && (
                          <li>
                            <Link to={`/products/contents/writing-style/#${matchWritingStyle.recordId}-0`}>
                              {matchWritingStyle.name}
                            </Link>
                          </li>
                        )}
                        {matchReason && (
                          <li>
                            <Link to={`/products/contents/idiomatic-usage/usage/#${matchReason.recordId}-0`}>
                              {matchReason.name}
                            </Link>
                          </li>
                        )}
                      </ul>
                    </ReasonCell>
                  </Row>
                )
              })}
            </Body>
          </Table>
        </Wrapper>
      )}
      {type === 'reason' && (
        <>
          {idiomaticUsageReason
            .filter((item) => {
              return item.name
            })
            .map(({ name, description, discussion, source, recordId }, index) => {
              const fragmentId = (suffixId: string) => {
                return recordId ? `${recordId}-${suffixId}` : ''
              }

              return (
                <Wrapper key={index}>
                  <FragmentTitle tag="h2" id={fragmentId('0')}>
                    {name}
                  </FragmentTitle>
                  {description && (
                    <FragmentTitle tag="h3" id={fragmentId('1')}>
                      説明
                    </FragmentTitle>
                  )}
                  {description && <div dangerouslySetInnerHTML={{ __html: description }} />}
                  {discussion && (
                    <FragmentTitle tag="h3" id={fragmentId('2')}>
                      議事録
                    </FragmentTitle>
                  )}
                  {discussion && getReplaceLinkText(discussion)}
                  {source && (
                    <FragmentTitle tag="h3" id={fragmentId('3')}>
                      出典
                    </FragmentTitle>
                  )}
                  {source && getReplaceLinkText(source)}
                </Wrapper>
              )
            })}
        </>
      )}
    </>
  )
}

const Wrapper = styled.div`
  & th,
  td {
    vertical-align: baseline;
  }
`
const StyledText = styled(Text)`
  white-space: pre-wrap;
  word-wrap: break-word;
`
const RecommendCell = styled(Cell)`
  white-space: nowrap;
`
const NGCell = styled(Cell)`
  min-width: 11em;
  width: 22em;
`
const ReasonCell = styled(Cell)`
  min-width: 22em;
  width: auto;
`
