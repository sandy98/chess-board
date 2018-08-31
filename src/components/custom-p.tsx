import { Component } from '@stencil/core'

@Component({tag: 'custom-p'})
export class CustomParagraph {
  render() {
    return (
      <p
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <slot/>
      </p>
    )
  }
}
