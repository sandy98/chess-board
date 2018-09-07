import { Component, Prop, Event, EventEmitter} from '@stencil/core'

interface iHeader {
  header: string
}

interface iMenu {
  x: number
  y: number
  menuDisplay: string
}

@Component({tag: 'context-menu'})
export class ContextMenu implements iMenu, iHeader {
  @Prop() items: number = 1
  @Prop() x: number = 0
  @Prop() y: number = 0
  @Prop() menuDisplay: string = 'none'
  @Prop() ovlBg: string = 'transparent'
  @Prop() header: string = ''
  @Prop() footer: string = ''

  @Event() closeMenu: EventEmitter

  render() {
      const availWidth: number = screen['availWidth']
      const availHeight: number = screen['availHeight']
      const arrItems: number[] = [...new Array(this.items)].map((_, i) => i)
      console.log(arrItems)

      const overlayStyle: object = {
        display: this.menuDisplay,
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${availWidth * 0.99}px`,
        height: `${availHeight* 0.82}px`,
        minWidth: `${availWidth* 0.99}px`,
        minHeight: `${availHeight* 0.82}px`,
        maxWidth: `${availWidth* 0.99}px`,
        maxHeight: `${availHeight* 0.82}px`,
        background: this.ovlBg,
        opacity: '1',
        zIndex: '10'
      }

      const menuStyle: object = {
        display: 'flex',
        flexDirection: 'column',
        justyfyContent: 'flex-start',
        position: 'relative',
        left: `${this.x}px`,
        top: `${this.y}px`,
        paddingLeft: '1em',
        minWidth: '10em',
        maxWidth: '20%',
        minHeight: '3em',
        //maxHeight: '12em',
        overFlowY: 'auto',
        color: 'black',
        background: 'white',
        border: 'solid 1px black',
        borderRadius: '5px',
        mozBoxShadowBottom: '10px 10px 10px black',
        webkitBoxShadowBottom: '10px 10px 10px black',
        boxShadowBottom: '10px 10px 10px black',        
        opacity: '1',
      }

      const tasksStyle: object = {
        listStyle: 'none',
        margin: '0',
        padding: '0'
      }

      const taskStyle: object = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: 'solid 1px #dfdfdf'
      }             

      return (   
          <div
            ref={(el: HTMLElement) => this['overlay'] = el}
            style={{...overlayStyle}}
            onClick={() => {
              this.closeMenu.emit()
            }}
          >
            <div
              style={{...menuStyle}}
              onClick={(e: MouseEvent) => {
                e.cancelBubble = true
              }}
            >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    padding: '0.5em'
                  }}
                >
                  <h3>{this.header}</h3>
                  <div
                    title="Close"
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: 'white',
                      padding: '0.2em',
                      background: 'red',
                      border: 'none',
                      borderRadius: '50%',
                      fontWeight: 'bolder',
                      fontSize: '1em',
                      width: '1.2em',
                      height: '1.2em'
                    }}
                    onClick={() => {
                      this.closeMenu.emit()
                    }}
                  >
                    X
                  </div>
                </div>
                <ul style={{...tasksStyle}}>
                  {
                    arrItems.map(n => {
                      return (
                        <li style={{...taskStyle}} key={n}>
                          <slot name={n.toString()}/>
                        </li>
                      )
                    })
                  }
                </ul>

            </div>
          </div>
      )
  }
}