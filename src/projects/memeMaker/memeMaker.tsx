import React from 'react';
import { Modal, ModalHeader, ModalBody, FormGroup, Label, NavbarBrand } from 'reactstrap';


const photos = [
    {src: '/images/stolf.jpg'}
];

const initialState = {
    topText: "",
    bottomText: "",
    isTopDragging: false,
    isBottomDragging: false,
    topY: "10%",
    topX: "50%",
    bottomX: "50%",
    bottomY: "90%"
}

interface MemeMakerState {
    currentImage: number;
    modalIsOpen: boolean;
    currentImageBase64?: string | null;
    topText: string;
    bottomText: string;
    isTopDragging: boolean;
    isBottomDragging: boolean;
    topY: string;
    topX: string;
    bottomX: string;
    bottomY: string;
}

class MemeMaker extends React.Component<{}, MemeMakerState> {
    imageRef: React.RefObject<SVGImageElement | null> = React.createRef();

    constructor(props: {}) {
        super(props);
        this.state = {
            currentImage: 0,
            modalIsOpen: false,
            currentImageBase64: null,
            ...initialState
        };
    }


    getBase64Image(img: HTMLImageElement): string {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext("2d");
        context?.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL;
    }

    openImage = (index: number) => {
        const image = photos[index];
        const baseImage = new Image();
        baseImage.src = image.src;
        const currentImageBase64 = this.getBase64Image(baseImage);
        this.setState(prevState =>({
            currentImage: index,
            modalIsOpen: !prevState.modalIsOpen,
            currentImageBase64,
            ...initialState
        }));
    }

    toggle = () => {
        this.setState(prevState => ({
            modalIsOpen: !prevState.modalIsOpen
        }));
    }

    changeText = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.currentTarget;
        if (name === 'toptext') {
            this.setState({ topText: value });
        } else if (name === 'bottomtext') {
            this.setState({ bottomText: value });
        }
    }

    getStateObj = (e: React.MouseEvent<SVGTextElement>, type: 'top' | 'bottom') => {
        if (!this.imageRef.current) {
            return {};
        }
        const svgElement = this.imageRef.current.ownerSVGElement;
        if (!svgElement) {
            return {};
        }
        const rect = svgElement.getBoundingClientRect();
        const xOffset = e.clientX - rect.left;
        const yOffset = e.clientY - rect.top;
        let stateObj: Partial<MemeMakerState> = {};
        if (type === "bottom") {
            stateObj = {
                isBottomDragging: true,
                isTopDragging: false,
                bottomX: `${xOffset}px`,
                bottomY: `${yOffset}px`
            }
        } else if (type === "top") {
            stateObj = {
                isTopDragging: true,
                isBottomDragging: false,
                topX: `${xOffset}px`,
                topY: `${yOffset}px`
            }
        }
        return stateObj;
    }



    render() {
        // Calculate dimensions for the modal image
        const image = photos[this.state.currentImage];
        const base_image = new Image();
        base_image.src = image.src;
        // Default dimensions if image hasn't loaded yet
        const defaultWidth = 600;
        const defaultHeight = 400;
        const wrh = base_image.width && base_image.height 
            ? base_image.width / base_image.height 
            : defaultWidth / defaultHeight;
        const newWidth = defaultWidth;
        const newHeight = base_image.width && base_image.height 
            ? newWidth / wrh 
            : defaultHeight;

        return (
            <div className="content">
                {photos.map((image, index) => (
                    <div className="image-holder" key={image.src}>
                    <span className="meme-top-caption">Top text</span>
                    <img
                    style = {{
                        width: "100%",
                        cursor: "pointer",
                        height: "100%"
                    }}
                    alt={String(index)}
                    src={image.src}
                    onClick={() => this.openImage(index)}
                    role="presentation"
                    />
                    <span className = "meme-bottom-caption">Bottom text</span>
                    </div>
                ))}

                <Modal className="meme-gen-modal" isOpen={this.state.modalIsOpen}>
                    <ModalHeader toggle={this.toggle}>Make a Meme</ModalHeader>

                    <ModalBody>
                        <svg
                            width={newWidth}
                            height={newHeight}
                            xmlns="http://www.w3.org/1999/xlink">
                            <image
                                ref={this.imageRef}
                                xlinkHref={this.state.currentImageBase64 || undefined}
                                height={newHeight}
                                width={newWidth}
                            />
                        <text
                        style={{...textStyle, zIndex: this.state.isTopDragging ? 4 : 1}}
                        x={this.state.topX}
                        y={this.state.topY}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        onMouseDown={event => this.handleMouseDown(event, 'top')}
                        onMouseUp={event => this.handleMouseUp(event, 'top')}
                        >
                            {this.state.topText}
                        </text>
                        <text
                        style={textStyle}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x = {this.state.bottomX}
                        y = {this.state.bottomY}
                        onMouseDown={event => this.handleMouseDown(event, 'bottom')}
                        onMouseUp={event => this.handleMouseUp(event, 'bottom')}
                        >
                            {this.state.bottomText}
                        </text>
                    </svg>
                    <div className="meme-form">
                        <FormGroup>
                            <Label for="toptext">Top Text</Label>
                            <input className="form-control" type="text" name="toptext" id="toptext" placeholder="Add text to the top" onChange={this.changeText} />
                        </FormGroup>
                        <FormGroup>
                            <Label for="bottomtext">Bottom Text</Label>
                            <input className="form-control" type="text" name="bottomtext" id="bottomtext" placeholder="Add text to the bottom" onChange={this.changeText} />                      
                        </FormGroup>
                        <button onClick={() => this.convertSvgToImage()} className = "btn btn-primary">Download Image</button>
                    </div>
                    
                    </ModalBody>
                </Modal>
            </div>
            

        )
    }
}

export default MemeMaker;