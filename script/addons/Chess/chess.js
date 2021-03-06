//
// Chess for Sony Reader
// by Ben Chenoweth
//
// 2 player mode code based on HTML Chess, version 1.0 revision #8, by Stefano Gioffre' (http://htmlchess.sourceforge.net/)
// AI uses slightly modified Toga II v1.3.1 (http://www.superchessengine.com/toga_ii.htm)
//
//	2012-04-23 Ben Chenoweth - Replaced javascript AI with Toga II executable (alpha release)
//	2012-04-24 Ben Chenoweth - Removed AI move display; fixed checkmate message; fix for AI pawn promotion
//	2012-04-25 Ben Chenoweth - Properly handle en passant; disable castling if rooks moved; fixed ancient bug that had disabled black castling in 2 player mode; undo/save/load castling/en passant status
//	2012-05-06 Ben Chenoweth - Fix for en passant
//	2012-05-22 Ben Chenoweth - Removed unused variables; changed globals to locals
//	2012-05-24 Ben Chenoweth - 'Play As Black' mode

var tmp = function () {
    var bCheck = false, bGameNotOver = true, lastStart = 0, lastEnd = 0, kings = [0, 0],
    etc = {
        aBoard: [],
        nPromotion: 0,
        bBlackSide: false,
        lookAt: function (nGetPosX, nGetPosY) {
            return (this.aBoard[nGetPosY * 10 + nGetPosX + 22]);
        }
    },
	fourBtsLastPc,
	flagWhoMoved,
	bHasMoved = false,
	wHasMoved = false,
	wOldKing = 96,
	bOldKing = 26,
	nFrstFocus,
	nScndFocus,
	aParams = [5, 3, 4, 6, 2, 4, 3, 5, 1, 1, 1, 1, 1, 1, 1, 1, 9, 9, 9, 9, 9, 9, 9, 9, 13, 11, 12, 14, 10, 12, 11, 13],
	cursorX = 0,
	cursorY = 520,
	isNT = kbook.autoRunRoot.hasNumericButtons,
	getSoValue = kbook.autoRunRoot.getSoValue,
	setSoValue = kbook.autoRunRoot.setSoValue,
	shellExec = kbook.autoRunRoot.shellExec,
	getFileContent = kbook.autoRunRoot.getFileContent,
	setFileContent = kbook.autoRunRoot.setFileContent,
	mouseLeave = getSoValue(target.PUZZLE_DIALOG.btn_Cancel, 'mouseLeave'),
	mouseEnter = getSoValue(target.PUZZLE_DIALOG.btn_Cancel, 'mouseEnter'),
	
	moveno = 0, // no of moves
	level = 2, // "Medium"
	automode = true, // reader will automatically move
	playAsBlack = false, // player controls the white pieces
	inputHeader,
	newGame,
	enPassant = "",
	wRooks = "KQ",
	bRooks = "kq",
	//debugOutput = "",
	//debugPath = "/Data/debug.txt",

    // Undo
	undoboard,
	currundo,
	undodepth,
	undosettings,

    // Save/Load
	datPath,

    // Puzzles
	puzPath,
	puzDatPath,
	maxMateIn2 = 90,
	maxMateIn3 = 180,
	maxMateIn4 = 45,
	puzzDlgOpen = false,
	doingPuzzle = false,
	puzzleMoves,
	datPath0 = kbook.autoRunRoot.gamesSavePath + 'Chess/',

    //DrMerry: Added game-scope vars
	merryMessage, t, n, x, y, s, custSel,
	//unused z

    //DrMerry: Added text string array
    chessGame = {
        textString: [
	["White", "Black"],
	["Queen", "Rook", "Bishop", "Knight"],
	["[0] AI speed: ", "Fast", "Medium", "Slow"],
	["On", "Off"]]
    };

	/*target.debugOut = function (text) {
		debugOutput += text + "\n";
	}*/
	
    target.init = function () {
        /* set translated appTitle and appIcon */
        var stream, cMateIn2, cMateIn3, cMateIn4,
				tempnum, t;
				// unused x, y, z, mz
        this.appTitle.setValue(kbook.autoRunRoot._title);
        this.appIcon.u = kbook.autoRunRoot._icon;
		this.enable(true);

        FileSystem.ensureDirectory(datPath0);
        datPath = datPath0 + 'chess.dat';
        puzPath = target.chessRoot + 'puzzles/';
        puzDatPath = datPath0 + 'chess2.dat';

        // load current puzzle numbers (if they exist)
        try {
            if (FileSystem.getFileInfo(puzDatPath)) {
                stream = new Stream.File(puzDatPath);
                tempnum = stream.readLine();
                cMateIn2 = Math.floor(tempnum);
                // convert string to integer
                tempnum = stream.readLine();
                cMateIn3 = Math.floor(tempnum);
                // convert string to integer
                tempnum = stream.readLine();
                cMateIn4 = Math.floor(tempnum);
                // convert string to integer
                stream.close();
                target.setVariable("checkmate_2", cMateIn2);
                target.setVariable("checkmate_3", cMateIn3);
                target.setVariable("checkmate_4", cMateIn4);
            }
        } catch (e) { }

        // hide unwanted graphics
        this.congratulations.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection2.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection3.changeLayout(0, 0, uD, 0, 0, uD);
        this.checkStatus.setValue("");
        this.puzzleName.setValue("");
        this.puzzleSource.setValue("");
        this.puzzleMoves.setValue("");

        if (isNT) {
            this.BUTTON_RES.show(false);
            this.BUTTON_SAV.show(false);
            this.BUTTON_LOA.show(false);
            this.BUTTON_PUZ.show(false);
            this.gridCursor.changeLayout(cursorX, 75, uD, cursorY, 75, uD);
            this.touchButtons0.show(false);
            this.touchButtons1.show(false);
            this.touchButtons2.show(false);
            this.touchButtons3.show(false);
            this.touchButtons4.show(false);
            this.sometext1.show(false);
            this.sometext2.show(false);
        } else {
            this.gridCursor.changeLayout(0, 0, uD, 0, 0, uD);
            this.nonTouch.show(false);
            this.nonTouch2.show(false);
            this.nonTouch3.show(false);
            this.nonTouch4.show(false);
            this.nonTouch5.show(false);
            this.nonTouch6.show(false);
            this.nonTouch7.show(false);
            this.nonTouch8.show(false);
            this.nonTouch9.show(false);
            this.nonTouch_colHelp.show(false);
        }

        // initiate new game
        this.resetBoard();
        this.writePieces();

        // set up undo arrays
        undodepth = 11;
        // this allows for 10 undos
        currundo = 0;
        undoboard = new Array(undodepth);
	undosettings = new Array(undodepth);
        t = 0;
        for (t; t < undodepth; t++) {
	  undoboard[t] = new Array(120);
	  undosettings[t] = new Array(7);
        }
        this.updateUndo();
		
		// setup for chess engine
		FileSystem.ensureDirectory("/tmp/fruit/");
		inputHeader = "uci\n";
		if (FileSystem.getFileInfo(datPath0 + "performance.bin")) {
			inputHeader += "option name OwnBook value performance.bin\n";
		}
		inputHeader += "ucinewgame\nisready\n";
		//this.debugOut("inputHeader:\n"+inputHeader);
		
        return;
    };

    target.resetBoard = function () {
        var iParamId, iPosition;
        iParamId = 0;
        nFrstFocus = fourBtsLastPc = lastStart = lastEnd = 0;
        flagWhoMoved = 8;
        wHasMoved = false;
        bHasMoved = false;
        wOldKing = 96;
        bOldKing = 26;
		newGame = true;
		enPassant = "";
		wRooks = "KQ";
		bRooks = "kq";
		
        // place all pieces in their starting positions (located in the first 32 items of the aParams array)
        iPosition = 0;
        for (iPosition; iPosition < 120; iPosition++) {
            etc.aBoard[iPosition] = iPosition % 10 ? iPosition / 10 % 10 < 2 | iPosition % 10 < 2 ? 7 : iPosition / 10 & 4 ? 0 : this.getPcByParams(iParamId++, iPosition - 1) | 16 : 7;
            //this.debugOut("iPosition="+iPosition+", etc.aBoard="+etc.aBoard[iPosition - 1]);
        }
        this.checkStatus.setValue("");
        this.puzzleName.setValue("");
        this.puzzleSource.setValue("");
        this.puzzleMoves.setValue("");
        doingPuzzle = false;
    };

    target.writePieces = function () {
        var x, y, sSqrContent, nSquareId, iCell, pieceId = -1;
        //this.debugOut("redraw board");
        iCell = 0;
        for (iCell; iCell < 64; iCell++) {
            x = iCell % 8;
            // find column
            y = Math.floor(iCell / 8); // find row
            if (playAsBlack) {
				nSquareId = 121 - ((y + 2) * 10 + 2 + x);
			} else {
				nSquareId = (y + 2) * 10 + 2 + x;
			}
            sSqrContent = etc.aBoard[nSquareId];
            //this.debugOut("iCell="+iCell+", sSqrContent="+sSqrContent);
            if (sSqrContent > 0) {
                pieceId++;
                sSqrContent = sSqrContent - 17;
                if (sSqrContent > 5) {
                    // aParams assumes array of characters has two spaces separating black characters from white characters, but we don't
                    sSqrContent = sSqrContent - 2;
                }
                this['piece' + pieceId].u = sSqrContent;
                //this.debugOut("sSqrContent="+sSqrContent+", x="+x+", y="+y);
                this['piece' + pieceId].changeLayout(x * 75, 75, uD, y * 75 + 70, 75, uD);
            }
            if (nSquareId === lastStart) {
                // place selection2 mask over square to indicate previous move start
                this.selection2.changeLayout(x * 75, 75, uD, y * 75 + 70, 75, uD);
            }
            if (nSquareId === lastEnd) {
                // place selection3 mask over square to indicate previous move end
                this.selection3.changeLayout(x * 75, 75, uD, y * 75 + 70, 75, uD);
            }
        }

        // hide unwanted pieces
        if (pieceId < 31) {
            do {
                pieceId++;
                this['piece' + pieceId].changeLayout(0, 0, uD, 0, 0, uD);
            } while (pieceId < 31);
        }
    };

    target.doSquareClick = function (sender) {
        var id, x, y, iPosition;
        id = getSoValue(sender, "id");
        n = id.substring(6, 8);
        x = n % 8; // find column
        y = Math.floor(n / 8); // find row
		if (playAsBlack) {
			iPosition = 121 - ((y + 2) * 10 + 2 + x);
		} else {
			iPosition = (y + 2) * 10 + 2 + x;
		}
        //this.debugOut("n="+n+", iPosition="+iPosition);
        this.makeSelection(iPosition);
        return;
    };

    target.makeSelection = function (nSquareId) {
        var x, y, destx, desty, ourRook, flagPcColor, nPieceType, nPiece, xRook, nWay, nDiffX, nDiffY;
        if (!bGameNotOver) {
            return;
        }
        fourBtsLastPc = etc.aBoard[nSquareId] - 16;
        //this.debugOut("etc.aBoard[nSquareId]="+etc.aBoard[nSquareId]+", flagWhoMoved="+flagWhoMoved+", fourBtsLastPc="+fourBtsLastPc);
        if ((fourBtsLastPc > 8) && (!etc.bBlackSide)) {
            if (nFrstFocus) {
                this.squareFocus(nFrstFocus, false);
                nFrstFocus = 0;
            }
			this.squareFocus(nSquareId, true);
			nFrstFocus = nSquareId;
        } else if (nFrstFocus && (fourBtsLastPc < 9) && !etc.bBlackSide) {
            x = nFrstFocus % 10 - 2;
            y = (nFrstFocus - nFrstFocus % 10) / 10 - 2;
            destx = nSquareId % 10 - 2;
            desty = (nSquareId - nSquareId % 10) / 10 - 2;
            //this.debugOut("x="+x+", y="+y+", destx="+destx+", desty="+desty);
            if (this.isValidMove(x, y, destx, desty, false, -1, true)) {
				// revert button/label to "New Game"
				setSoValue(target.BUTTON_RES, 'text', "New Game");
				this.nonTouch.setValue("[Hold 9] New Game");
				mouseEnter.call(target.BUTTON_RES);
				mouseLeave.call(target.BUTTON_RES);
				
				newGame = false;
                nScndFocus = nSquareId;
                fourBtsLastPc = etc.aBoard[nFrstFocus] & 15;

                // check for pawn promotion
                if ((fourBtsLastPc === 9) && (nScndFocus <= 29)) {
                    fourBtsLastPc = 14 - etc.nPromotion;
                }

                // update move
                etc.aBoard[nFrstFocus] = 0;
                etc.aBoard[nSquareId] = fourBtsLastPc + 16;
                lastStart = nFrstFocus;
                lastEnd = nSquareId;

                // need to handle (white) castling
                nPiece = etc.aBoard[nSquareId];
                nPieceType = nPiece & 7;
                if (nPieceType === 2) {
                    wHasMoved = true;
                }
                nDiffX = destx - x;
                nDiffY = desty - y;
                xRook = 30 - nDiffX >> 2 & 7;
                ourRook = etc.lookAt(xRook, desty);
                if ((nPieceType === 2) && (nDiffX + 2 | 4) === 4 && nDiffY === 0 && ourRook > 0 && Boolean(ourRook & 16)) {
                    etc.aBoard[desty * 10 + xRook + 22] = 0;
                    if (destx === 6) {
                        etc.aBoard[nSquareId - 1] = ourRook;
                    } else if (destx === 2) {
                        etc.aBoard[nSquareId + 1] = ourRook;
                    }
                }
				
				// need to disable possibility of castling if rooks moved
				if ((nPieceType === 5) && (nFrstFocus === 92) && (wRooks.indexOf("Q")>=0)) {
					if (wRooks === "KQ") {
						wRooks = "K";
					} else if (wRooks === "Q") {
						wRooks = "";
					}
				}
				if ((nPieceType === 5) && (nFrstFocus === 99) && (wRooks.indexOf("K")>=0)) {
					if (wRooks === "KQ") {
						wRooks = "Q";
					} else if (wRooks === "K") {
						wRooks = "";
					}
				}

                // need to handle en passant
                flagPcColor = nPiece & 8;
                nWay = 4 - flagPcColor >> 2;
                if ((nPieceType === 1) && (y === 7 + nWay >> 1) && (enPassant === nSquareId)) {
                    // remove (black) pawn
                    etc.aBoard[nSquareId + 10] = 0;
                }
				if ((nPieceType === 1) && (nDiffY === -2)) {
					enPassant = nSquareId + 10;
				} else {
					enPassant = "";
				}

                // remove selections
                this.squareFocus(nFrstFocus, false);
                nFrstFocus = 0;

                // redraw board
                this.writePieces();
                this.updateUndo();

                // update location of king when it is moved
                if (nPieceType === 2) {
                    kings[flagPcColor >> 3] = nSquareId;
                }
                
				// check for checkmate
                this.getInCheckPieces();

                // switch player
                etc.bBlackSide = !etc.bBlackSide;
                flagWhoMoved ^= 8;
                this.messageStatus.setValue(chessGame.textString[0][1] + "'s turn");

                // get stuff ready for next move
                moveno++;
                if (doingPuzzle) {
                    // update number of moves for puzzle
                    puzzleMoves = Math.floor((moveno + 1) / 2);
                    this.puzzleMoves.setValue(puzzleMoves);
                }

                if ((automode) && (!playAsBlack)) {
                    FskUI.Window.update.call(kbook.model.container.getWindow());
                    this.doSize();
                }
            }
        } else if ((fourBtsLastPc > 0) && (fourBtsLastPc < 9) && (etc.bBlackSide)) {
            if (nFrstFocus) {
                this.squareFocus(nFrstFocus, false);
                nFrstFocus = 0;
            }
			this.squareFocus(nSquareId, true);
			nFrstFocus = nSquareId;
        } else if (nFrstFocus && ((fourBtsLastPc > 8) || (fourBtsLastPc < 0)) && etc.bBlackSide) {
            x = nFrstFocus % 10 - 2;
            y = (nFrstFocus - nFrstFocus % 10) / 10 - 2;
            destx = nSquareId % 10 - 2;
            desty = (nSquareId - nSquareId % 10) / 10 - 2;
            //this.debugOut("x="+x+", y="+y+", destx="+destx+", desty="+desty);
            if (this.isValidMove(x, y, destx, desty, false, -1, true)) {
				// revert button/label to "New Game"
				setSoValue(target.BUTTON_RES, 'text', "New Game");
				this.nonTouch.setValue("[Hold 9] New Game");
				mouseEnter.call(target.BUTTON_RES);
				mouseLeave.call(target.BUTTON_RES);
				
                nScndFocus = nSquareId;
                fourBtsLastPc = etc.aBoard[nFrstFocus] - 16;

                // check for pawn promotion
                if ((fourBtsLastPc === 1) && (nScndFocus >= 90)) {
                    fourBtsLastPc = 6 - etc.nPromotion;
                }

                // update move
                etc.aBoard[nFrstFocus] = 0;
                etc.aBoard[nSquareId] = fourBtsLastPc + 16;
                lastStart = nFrstFocus;
                lastEnd = nSquareId;

                // need to handle (black) castling
                nPiece = etc.aBoard[nSquareId];
                nPieceType = nPiece & 7;
                if (nPieceType === 2) {
                    bHasMoved = true;
                }
                nDiffX = destx - x;
                nDiffY = desty - y;
                xRook = 30 - nDiffX >> 2 & 7;
                ourRook = etc.lookAt(xRook, desty);
                if ((nPieceType === 2) && (nDiffX + 2 | 4) === 4 && nDiffY === 0 && ourRook > 0 && Boolean(ourRook & 16)) {
                    etc.aBoard[desty * 10 + xRook + 22] = 0;
                    if (destx === 6) {
                        etc.aBoard[nSquareId - 1] = ourRook;
                    } else if (destx === 2) {
                        etc.aBoard[nSquareId + 1] = ourRook;
                    }
                }
				
				// need to disable possibility of castling if rooks moved
				if ((nPieceType === 5) && (nFrstFocus === 22) && (bRooks.indexOf("q")>=0)) {
					if (bRooks === "kq") {
						bRooks = "k";
					} else if (bRooks === "q") {
						bRooks = "";
					}
				}
				if ((nPieceType === 5) && (nFrstFocus === 29) && (bRooks.indexOf("k")>=0)) {
					if (bRooks === "kq") {
						bRooks = "q";
					} else if (bRooks === "k") {
						bRooks = "";
					}
				}
				
                // need to handle en passant
                flagPcColor = nPiece & 8;
                nWay = 4 - flagPcColor >> 2;
                if ((nPieceType === 1) && (y === 7 + nWay >> 1) && (enPassant === nSquareId)) {
                    // remove pawn
                    etc.aBoard[nSquareId - 10] = 0;
                }
				if ((nPieceType === 1) && (nDiffY === 2)) {
					enPassant = nSquareId - 10;
				} else {
					enPassant = "";
				}
				
                // remove selections
                this.squareFocus(nFrstFocus, false);
                nFrstFocus = 0;

                // redraw board
                this.writePieces();
                this.updateUndo();

                // update location of king when it is moved
                if (nPieceType === 2) {
                    kings[flagPcColor >> 3] = nSquareId;
                }
                
				// check for checkmate
                this.getInCheckPieces();

                // switch player
                etc.bBlackSide = !etc.bBlackSide;
                flagWhoMoved ^= 8;
                this.messageStatus.setValue(chessGame.textString[0][0] + "'s turn");

                // get stuff ready for next move
                moveno++;
                if (doingPuzzle) {
                    // update number of moves for puzzle
                    puzzleMoves = Math.floor((moveno + 1) / 2);
                    this.puzzleMoves.setValue(puzzleMoves);
                }
				
                if ((automode) && (playAsBlack)) {
                    FskUI.Window.update.call(kbook.model.container.getWindow());
                    this.doSize();
                }
            }
        }
        return;
    };

    target.squareFocus = function (nPieceId, bMakeActive) {
        var x, y;
        //this.debugOut("bMakeActive="+bMakeActive);
		if (playAsBlack) {
			nPieceId = 121 - nPieceId;
		}
        if (etc.bBlackSide) {
            x = (nPieceId - 2) % 10;
            y = Math.floor((nPieceId - 22) / 10);
            //this.debugOut("nPieceId="+nPieceId+", x="+x+", y="+y);
            if (bMakeActive) {
                this.selection1.changeLayout(x * 75, 75, uD, y * 75 + 70, 75, uD);
            } else {
                this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
            }
        } else {
            x = (nPieceId - 2) % 10;
            y = Math.floor((nPieceId - 22) / 10);
            //this.debugOut("nPieceId="+nPieceId+", x="+x+", y="+y);
            if (bMakeActive) {
                this.selection1.changeLayout(x * 75, 75, uD, y * 75 + 70, 75, uD);
            } else {
                this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
            }
        }
        return;
    };

    target.isValidMove = function (nPosX, nPosY, nTargetX, nTargetY, inCheck, colorPcInCheck, firstMove) {
        var startSq, nPiece, endSq, nTarget, nPieceType, flagPcColor, kingHasMoved,
		flagTgColor, pawnHasMoved, nWay, nDiffX, nDiffY, flagOpColor,
		bKingInCheck, passX, nTargetType,
        oKing, iObliqueY, iObliqueX, iOrthogX, iOrthogY;
        //this.debugOut("isValidMove?");
        startSq = nPosY * 10 + nPosX + 22;
        nPiece = etc.aBoard[startSq];
        if (nPiece === 0) {
            //this.debugOut("No piece there!");
            return (true);
        }
        endSq = nTargetY * 10 + nTargetX + 22;
        nTarget = etc.aBoard[endSq];
        nPieceType = nPiece & 7;
        flagPcColor = nPiece & 8;
        //this.debugOut("startSq="+startSq+", nPiece="+nPiece+", nPieceType="+nPieceType+", flagPcColor="+flagPcColor);
        kingHasMoved = (flagPcColor === 8) ? wHasMoved : bHasMoved;
        flagTgColor = nTarget & 8;
        pawnHasMoved = Boolean(nPiece & 16 ^ 16);
        //this.debugOut("endSq="+endSq+", nTarget="+nTarget+", flagTgColor="+flagTgColor);
        nWay = 4 - flagPcColor >> 2;
        nDiffX = nTargetX - nPosX;
        nDiffY = nTargetY - nPosY;
        switch (nPieceType) {
            case 1:
                // pawn
                if (((nDiffY | 7) - 3) >> 2 !== nWay) {
                    //this.debugOut("Invalid move for pawn");
                    return (false);
                }
                if (nDiffX === 0) {
                    if ((nDiffY + 1 | 2) !== 2 && (nDiffY + 2 | 4) !== 4) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                    if (nTarget > 0) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                    if (nTargetY === nPosY + (2 * nWay)) {
                        if (pawnHasMoved) {
                            //this.debugOut("Invalid move for pawn");
                            return (false);
                        }
                        if (etc.lookAt(nTargetX, nTargetY - nWay) > 0) {
                            //this.debugOut("Invalid move for pawn");
                            return (false);
                        }
                    }
                    if ((nDiffY === -2) && (nPosY !== 6)) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                    if ((nDiffY === 2) && (nPosY !== 1)) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                } else if ((nDiffX + 1 | 2) === 2) {
                    if (nDiffY !== nWay) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                    if ((nTarget < 1 || flagTgColor === flagPcColor) && /* not en passant: */ !((firstMove) && (nPosY === 7 + nWay >> 1) && (enPassant === endSq))) {
                        //this.debugOut("Invalid move for pawn");
                        return (false);
                    }
                } else {
                    //this.debugOut("Invalid move for pawn");
                    return (false);
                }
                break;
            case 2:
                // king
                if ((nDiffY === 0 || (nDiffY + 1 | 2) === 2) && (nDiffX === 0 || (nDiffX + 1 | 2) === 2)) {
                    if (nTarget > 0 && flagTgColor === flagPcColor) {
                        //this.debugOut("Invalid move for king");
                        return (false);
                    }
                } else if (target.tryingToCastle(nTargetY, nDiffX, nDiffY, flagPcColor)) {
                    // castling
                    passX = nDiffX * 3 + 14 >> 2;
					flagOpColor = flagPcColor ^ 8;
                    for (passX; passX < nDiffX * 3 + 22 >> 2; passX++) {
                        if (etc.lookAt(passX, nTargetY) > 0 || this.isThreatened(passX, nTargetY, flagOpColor)) {
                            //this.debugOut("Invalid move for king");
                            return (false);
                        }
                    }
                    if (nDiffX + 2 === 0 && etc.aBoard[nTargetY * 10 + 1 + 22] > 0) {
                        //this.debugOut("Invalid move for king");
                        return (false);
                    }
					// check to see if rooks have been moved
					if (flagPcColor === 8) {
						// white
						if ((startSq === 96) && (endSq === 94) && (wRooks.indexOf("Q") === -1)) {
							return (false);
						}
						if ((startSq === 96) && (endSq === 98) && (wRooks.indexOf("K") === -1)) {
							return (false);
						}
					} else {
						// black
						if ((startSq === 26) && (endSq === 24) && (bRooks.indexOf("q") === -1)) {
							return (false);
						}
						if ((startSq === 26) && (endSq === 28) && (bRooks.indexOf("k") === -1)) {
							return (false);
						}
					}
                } else {
                    //this.debugOut("Invalid move for king");
                    return (false);
                }
                break;
            case 3:
                // knight
                if (((nDiffY + 1 | 2) - 2 | (nDiffX + 2 | 4) - 2) !== 2 && ((nDiffY + 2 | 4) - 2 | (nDiffX + 1 | 2) - 2) !== 2) {
                    //this.debugOut("Invalid move for knight");
                    return (false);
                }
                if (nTarget > 0 && flagTgColor === flagPcColor) {
                    //this.debugOut("Invalid move for knight");
                    return (false);
                }
                break;
            case 4:
                // bishop
                if (Math.abs(nDiffX) !== Math.abs(nDiffY)) {
                    //this.debugOut("Invalid move for bishop");
                    return (false);
                }
                break;
            case 5:
                // rook
                if (nTargetY !== nPosY && nTargetX !== nPosX) {
                    //this.debugOut("Invalid move for rook");
                    return (false);
                }
                break;
            case 6:
                // queen
                if (nTargetY !== nPosY && nTargetX !== nPosX && Math.abs(nDiffX) !== Math.abs(nDiffY)) {
                    //this.debugOut("Invalid move for queen");
                    return (false);
                }
                break;
        }

        // additional checks
        if (nPieceType === 5 || nPieceType === 6) {
            // check to see if all squares between start and end are clear for rook or queen
            if (nTargetY === nPosY) {
                if (nPosX < nTargetX) {
                    iOrthogX = nPosX + 1;
                    for (iOrthogX; iOrthogX < nTargetX; iOrthogX++) {
                        if (etc.lookAt(iOrthogX, nTargetY) > 0) {
                            //this.debugOut("Invalid move for rook or queen");
                            return (false);
                        }
                    }
                } else {
                    iOrthogX = nPosX - 1;
                    for (iOrthogX; iOrthogX > nTargetX; iOrthogX--) {
                        if (etc.lookAt(iOrthogX, nTargetY) > 0) {
                            //this.debugOut("Invalid move for rook or queen");
                            return (false);
                        }
                    }
                }
            }
            if (nTargetX === nPosX) {
                if (nPosY < nTargetY) {
                    iOrthogY = nPosY + 1;
                    for (iOrthogY; iOrthogY < nTargetY; iOrthogY++) {
                        if (etc.lookAt(nTargetX, iOrthogY) > 0) {
                            //this.debugOut("Invalid move for rook or queen");
                            return (false);
                        }
                    }
                } else {
                    iOrthogY = nPosY - 1;
                    for (iOrthogY; iOrthogY > nTargetY; iOrthogY--) {
                        if (etc.lookAt(nTargetX, iOrthogY) > 0) {
                            //this.debugOut("Invalid move for rook or queen");
                            return (false);
                        }
                    }
                }
            }
            if (nTarget > 0 && flagTgColor === flagPcColor) {
                //this.debugOut("Invalid move for rook or queen");
                return (false);
            }
        }

        if (nPieceType === 4 || nPieceType === 6) {
            // check to see if all squares between start and end are clear for bishop or queen
            if (nTargetY > nPosY) {
                iObliqueY = nPosY + 1;
                if (nPosX < nTargetX) {
                    iObliqueX = nPosX + 1;
                    for (iObliqueX; iObliqueX < nTargetX; iObliqueX++) {
                        if (etc.lookAt(iObliqueX, iObliqueY) > 0) {
                            //this.debugOut("Invalid move for bishop or queen");
                            return (false);
                        }
                        iObliqueY++;
                    }
                } else {
                    iObliqueX = nPosX - 1;
                    for (iObliqueX; iObliqueX > nTargetX; iObliqueX--) {
                        if (etc.lookAt(iObliqueX, iObliqueY) > 0) {
                            //this.debugOut("Invalid move for bishop or queen");
                            return (false);
                        }
                        iObliqueY++;
                    }
                }
            }
            else if (nTargetY < nPosY) {
                iObliqueY = nPosY - 1;
                if (nPosX < nTargetX) {
                    iObliqueX = nPosX + 1;
                    for (iObliqueX; iObliqueX < nTargetX; iObliqueX++) {
                        if (etc.lookAt(iObliqueX, iObliqueY) > 0) {
                            //this.debugOut("Invalid move for bishop or queen");
                            return (false);
                        }
                        iObliqueY--;
                    }
                } else {
                    iObliqueX = nPosX - 1;
                    for (iObliqueX; iObliqueX > nTargetX; iObliqueX--) {
                        if (etc.lookAt(iObliqueX, iObliqueY) > 0) {
                            //this.debugOut("Invalid move for bishop or queen");
                            return (false);
                        }
                        iObliqueY--;
                    }
                }
            }
            if (nTarget > 0 && flagTgColor === flagPcColor) {
                //this.debugOut("Invalid move for bishop or queen");
                return (false);
            }
        }

        if (nPieceType === 2) {
            // if king moves (possibly taking the piece that currently has him in check), will he still be in check?
            bKingInCheck = false;
            etc.aBoard[startSq] = 0;
            etc.aBoard[endSq] = nPiece;
            if (this.isThreatened(endSq % 10 - 2, (endSq - endSq % 10) / 10 - 2, flagPcColor ^ 8)) {
                bKingInCheck = true;
            }
            etc.aBoard[startSq] = nPiece;
            etc.aBoard[endSq] = nTarget;
            if (bKingInCheck) {
                //exception: if king is moving to take king (even if this places the moving king in check), then this is a valid move
                nTargetType = nTarget & 7;
                if (nTargetType !== 2) {
                    //this.debugOut("Invalid move for king");
                    return (false);
                }
            }
        } else {
            // if piece other than king moves, will king still be in check?
            //this.debugOut("inCheck="+inCheck+", flagPcColor="+flagPcColor+", colorPcInCheck="+colorPcInCheck);
            if ((inCheck) && (flagPcColor !== colorPcInCheck)) {
                // no need to do this if opponent's piece is already in check
                //this.debugOut("Invalid move, because opponent's piece is already in check");
                return (false);
            }
            oKing = kings[flagPcColor >> 3];
            etc.aBoard[startSq] = 0;
            etc.aBoard[endSq] = nPiece;
            //this.debugOut("Move piece of color "+flagPcColor+" from "+startSq+" to "+endSq+" with king at "+oKing);
            if ((inCheck) && (flagPcColor === colorPcInCheck)) {
                // if already in check and trying to find a move to get out of check
                if (this.isThreatened(oKing % 10 - 2, (oKing - oKing % 10) / 10 - 2, flagPcColor ^ 8)) {
                    //this.debugOut("King will (still) be in check");
                    bKingInCheck = true;
                }
            } else {
                if (firstMove) {
                    // see if moving this piece will place you in check
                    if (this.isThreatened(oKing % 10 - 2, (oKing - oKing % 10) / 10 - 2, flagPcColor ^ 8)) {
                        //this.debugOut("King will be in check");
                        bKingInCheck = true;
                    }
                }
            }
            etc.aBoard[startSq] = nPiece;
            etc.aBoard[endSq] = nTarget;
            if (bKingInCheck) {
                //this.debugOut("Invalid move because king is still (or will be) in check");
                return (false);
            }
        }
        //this.debugOut("Valid move");
        return (true);
    };

    target.tryingToCastle = function (nTargetY, nDiffX, nDiffY, flagPcColor) {
        var ourRook = etc.lookAt(30 - nDiffX >> 2 & 7, nTargetY),
		kingHasMoved = (flagPcColor === 8) ? wHasMoved : bHasMoved;
        return (nDiffX + 2 | 4) === 4 && nDiffY === 0 && !bCheck && !kingHasMoved && ourRook > 0 && Boolean(ourRook & 16);
    };

    target.isThreatened = function (nPieceX, nPieceY, flagFromColor) {
        //this.debugOut("isThreatened?: X="+nPieceX+", Y="+nPieceY+", By color="+flagFromColor);
        var iMenacing, bIsThrtnd = false, iMenaceY, iMenaceX;
        iMenaceY = 0;
        for (iMenaceY; iMenaceY < 8; iMenaceY++) {
            iMenaceX = 0;
            for (iMenaceX; iMenaceX < 8; iMenaceX++) {
                iMenacing = etc.aBoard[iMenaceY * 10 + iMenaceX + 22];
                if (iMenacing > 0 && (iMenacing & 8) === flagFromColor && this.isValidMove(iMenaceX, iMenaceY, nPieceX, nPieceY, false, -1, false)) {
                    bIsThrtnd = true;
                    //this.debugOut("Piece at X="+nPieceX+", Y="+nPieceY+" is threatened by piece at X="+iMenaceX+", Y="+iMenaceY);
                    break;
                }
            }
            if (bIsThrtnd) {
                break;
            }
        }
        //if (!bIsThrtnd) this.debugOut("Piece is not being threatened");
        return (bIsThrtnd);
    };

    target.doSelectClick = function (sender) {
      //TODO sender unused
        return;
    };

    target.doRoot = function (sender) {
      //TODO sender unused
        /*var stream;
		if (debugOutput !== "") {
			try {
				if (FileSystem.getFileInfo(debugPath)) FileSystem.deleteFile(debugPath);
				stream = new Stream.File(debugPath, 1);
				stream.writeLine(debugOutput);
				stream.close();
			} catch (e) { }
		}*/
		
        kbook.autoRunRoot.exitIf(kbook.model);
        return;
    };

    target.doMark = function (sender) {
      //TODO sender unused
        this.loadGame(datPath);
        return;
    };

    target.doHoldMark = function (sender) {
      //TODO sender unused
        this.saveGame();
        return;
    };

    target.updateUndo = function () {
        // update undo
        if (currundo < undodepth) {
            // increment current undo if possible
            currundo++;
        }
        else {
            // if not possible, then shift all previous undos, losing oldest one
            s = 1;
            for (s; s < undodepth; s++) {
                t = 0;
                for (t; t < 120; t++) {
                    undoboard[s - 1][t] = undoboard[s][t];
                }
				t = 0;
				for (t; t < 7; t++) {
					undosettings[s - 1][t] = undosettings[s][t];
				}
            }
        }

        // store current board
        t = 0;
        for (t; t < 120; t++) {
            undoboard[currundo - 1][t] = etc.aBoard[t];
        }
		
		// store current settings
		undosettings[currundo - 1][0] = (wHasMoved) ? "true" : "false";
		undosettings[currundo - 1][1] = (bHasMoved) ? "true" : "false";
		undosettings[currundo - 1][2] = String(wOldKing);
		undosettings[currundo - 1][3] = String(bOldKing);
		undosettings[currundo - 1][4] = (enPassant !== "") ? String(enPassant) : "";
		undosettings[currundo - 1][5] = wRooks;
		undosettings[currundo - 1][6] = bRooks;
        return;
    };

    target.doUndo = function (sender) {
      //TODO sender unused
        if (!bGameNotOver) { return; }

        // do undo
        if (currundo < 2) { return; }

        // retrieve most recent undo
        t = 0;
        for (t; t < 120; t++) {
            if (automode) {
                etc.aBoard[t] = undoboard[currundo - 3][t];
                if (etc.aBoard[t] === 18) { kings[0] = t; }
                if (etc.aBoard[t] === 26) { kings[1] = t; }
            } else {
                etc.aBoard[t] = undoboard[currundo - 2][t];
                if (etc.aBoard[t] === 18) { kings[0] = t; }
                if (etc.aBoard[t] === 26) { kings[1] = t; }
            }
        }

		if (automode) {
			wHasMoved = (undosettings[currundo - 3][0] === "true");// ? true : false;
			bHasMoved = (undosettings[currundo - 3][1] === "true");// ? true : false;
			wOldKing = undosettings[currundo - 3][2] * 1;
			bOldKing = undosettings[currundo - 3][3] * 1;
			enPassant = (undosettings[currundo - 3][4] !== "") ? undosettings[currundo - 3][4] * 1 : "";
			wRooks = undosettings[currundo - 3][5];
			bRooks = undosettings[currundo - 3][6];
		} else {
			wHasMoved = (undosettings[currundo - 2][0] === "true");// ? true : false;
			bHasMoved = (undosettings[currundo - 2][1] === "true");// ? true : false;
			wOldKing = undosettings[currundo - 2][2] * 1;
			bOldKing = undosettings[currundo - 2][3] * 1;
			enPassant = (undosettings[currundo - 2][4] !== "") ? undosettings[currundo - 2][4] * 1 : "";
			wRooks = undosettings[currundo - 2][5];
			bRooks = undosettings[currundo - 2][6];
		}

        // decrement current undo
        currundo--;
        if (automode) { currundo--; }

        // update board
        this.writePieces();
        if (!automode) {
            etc.bBlackSide = !etc.bBlackSide;
            flagWhoMoved ^= 8;
        }
        merryMessage = (etc.bBlackSide) ? chessGame.textString[0][1] : chessGame.textString[0][0];
        this.messageStatus.setValue(merryMessage + "'s turn");

        // get stuff ready for next move
        if (automode) {
            moveno -= 2;
        } else {
            moveno--;
        }
        if (doingPuzzle) {
            // update number of moves for puzzle
            puzzleMoves = Math.floor((moveno + 1) / 2);
            this.puzzleMoves.setValue(puzzleMoves);
        }

        // remove what moved highlights
        this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection2.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection3.changeLayout(0, 0, uD, 0, 0, uD);

        // check for check
        flagWhoMoved ^= 8;
        etc.bBlackSide = !etc.bBlackSide;
        this.getInCheckPieces();
        flagWhoMoved ^= 8;
        etc.bBlackSide = !etc.bBlackSide;
        return;
    };

    target.getInCheckPieces = function () {
        var iExamX, iExamY, iExamPc, bNoMoreMoves = true,
		myKing = kings[flagWhoMoved >> 3 ^ 1],
		pcInCheckColor = flagWhoMoved ^ 8,
		iExamSq, iWaySq, iTempY, iTempX;

        bCheck = this.isThreatened(myKing % 10 - 2, (myKing - myKing % 10) / 10 - 2, flagWhoMoved);
        //this.debugOut("getInCheckPieces: bCheck="+bCheck+", flagWhoMoved="+flagWhoMoved);
        if (bCheck) {
            merryMessage = (flagWhoMoved === 0) ? chessGame.textString[0][0] : chessGame.textString[0][1];
            merryMessage += " king is in check!";
        } else {
            merryMessage = "";
        }
		this.checkStatus.setValue(merryMessage);
        
        iExamSq = 22;
        for (iExamSq; iExamSq <= 99; iExamSq++) {
            // search the board
            if (iExamSq % 10 < 2) {
                continue;
            }
            //this.debugOut("iExamSq="+iExamSq);
            iExamX = (iExamSq - 2) % 10;
            iExamY = Math.floor((iExamSq - 22) / 10);
            iExamPc = etc.aBoard[iExamSq];
            if ((bNoMoreMoves && iExamPc > 0) && ((iExamPc & 8 ^ 8) === flagWhoMoved)) {
                // found a piece of the side whose king is in check
                //this.debugOut("Piece "+iExamPc+" found at="+iExamSq+" of color "+pcInCheckColor);
                iWaySq = 22;
                for (iWaySq; iWaySq <= 99; iWaySq++) {
                    // search the board looking for a valid move that will get them out of check
                    if (iWaySq % 10 < 2) {
                        continue;
                    }
                    //this.debugOut("iWaySq="+iWaySq);
                    iTempX = (iWaySq - 2) % 10;
                    iTempY = Math.floor((iWaySq - 22) / 10);
                    if (this.isValidMove(iExamX, iExamY, iTempX, iTempY, bCheck, pcInCheckColor, false)) {
                        //this.debugOut("Apparently, this is a valid move.  Piece at X="+iExamX+", Y="+iExamY+", to X="+iTempX+", Y="+iTempY);
                        bNoMoreMoves = false;
                        break;
                    }
                }
            }
        }
        //this.debugOut("bNoMoreMoves="+bNoMoreMoves+", bCheck="+bCheck);
        if (bNoMoreMoves) {
            if (bCheck) {
                merryMessage = etc.bBlackSide ? chessGame.textString[0][1] : chessGame.textString[0][0];
                this.checkStatus.setValue("Checkmate! " + merryMessage + " wins.");
                bGameNotOver = false;
            } else {
                this.checkStatus.setValue("Stalemate!");
                bGameNotOver = false;
            }
        } else {
            bGameNotOver = true;
        }
        return;
    };

    target.findNumberOfMoves = function () {
        flagWhoMoved ^= 8;
        var iExamX, iExamY, iExamPc, iTempY, iTempX,
		noOfMoves = 0,
		myKing = kings[flagWhoMoved >> 3 ^ 1],
		foundmove = [],

		bCheck = this.isThreatened(myKing % 10 - 2, (myKing - myKing % 10) / 10 - 2, flagWhoMoved),
		pcInCheckColor = flagWhoMoved ^ 8, iExamSq = 22, iWaySq;
        for (iExamSq; iExamSq <= 99; iExamSq++) {
            // search the board
            if (iExamSq % 10 < 2) {
                continue;
            }
            //this.debugOut("iExamSq="+iExamSq);
            iExamX = (iExamSq - 2) % 10;
            iExamY = Math.floor((iExamSq - 22) / 10);
            iExamPc = etc.aBoard[iExamSq];
            if ((iExamPc > 0) && ((iExamPc & 8 ^ 8) === flagWhoMoved)) {
                // found a piece of the side whose king is in check
                //this.debugOut("Piece "+iExamPc+" found at="+iExamSq+" of color "+pcInCheckColor);
                iWaySq = 22;
                for (iWaySq; iWaySq <= 99; iWaySq++) {
                    // search the board looking for a valid move that will get them out of check
                    if (iWaySq % 10 < 2) {
                        continue;
                    }
                    //this.debugOut("iWaySq="+iWaySq);
                    iTempX = (iWaySq - 2) % 10;
                    iTempY = Math.floor((iWaySq - 22) / 10);
                    if (this.isValidMove(iExamX, iExamY, iTempX, iTempY, bCheck, pcInCheckColor, false)) {
                        //this.debugOut("Apparently, this is a valid move.  Piece at X="+iExamX+", Y="+iExamY+", to X="+iTempX+", Y="+iTempY);
                        noOfMoves++;
                        foundmove = [noOfMoves, iExamX, iExamY, iTempX, iTempY];
                        if (noOfMoves > 1) { break; }
                    }
                }
            }
        }
        //this.debugOut("noOfMoves="+noOfMoves);
        flagWhoMoved ^= 8;
        return (foundmove);
    };

    target.getPcByParams = function (nParamId, nWhere) {
        var nPieceId = aParams[nParamId];
        if ((nPieceId & 7) === 2) {
            kings[nParamId >> 3 & 1] = nWhere + 1;
        }
        return (nPieceId);
    };

    target.doButtonClick = function (sender) {
        //var id;
        //id = getSoValue(sender, "id");
        //n = id.substring(7, 10);
        n = getSoValue(sender, "id").substring(7, 10);
	switch (n) {
	  case "RES":
	    this.doHold9();
            return;
	  case "EXT":
            kbook.autoRunRoot.exitIf(kbook.model);
            return;
	  case "LOA":
            this.loadGame(datPath);
            return;
	  case "SAV":
            this.saveGame();
            return;
	  case "PUZ":
            this.PUZZLE_DIALOG.open();
            return;
        }
    };

    target.saveGame = function () {
        var stream;
        try {
            if (FileSystem.getFileInfo(datPath)) { FileSystem.deleteFile(datPath); }
            stream = new Stream.File(datPath, 1);
            // save board to file
            t = 22;
            for (t; t <= 99; t++) {
                if (t % 10 > 1) {
                    stream.writeLine(etc.aBoard[t]);
                }
            }
            stream.writeLine(etc.bBlackSide);
            stream.writeLine(moveno);
			
			// save current settings
			stream.writeLine(wHasMoved);
			stream.writeLine(bHasMoved);
			stream.writeLine(wOldKing);
			stream.writeLine(bOldKing);
			stream.writeLine(enPassant);
			stream.writeLine(wRooks);
			stream.writeLine(bRooks);
			
			// save playAsBlack setting
			stream.writeLine(playAsBlack);
			
            stream.close();
            this.checkStatus.setValue("Game saved successfully");
        } catch (e) { this.checkStatus.setValue("Game save failed"); }
    };

    target.loadGame = function (filePath) {
        try {
            if (FileSystem.getFileInfo(filePath)) {
                var stream = new Stream.File(filePath), t, checkEOF;

                // load board from save file
                t = 22;
                for (t; t <= 99; t++) {
                    if (t % 10 > 1) {
                        //tempnum = stream.readLine();
                        etc.aBoard[t] = Math.floor(stream.readLine());
                        // convert string to integer
                        if (etc.aBoard[t] === 18) {
			  kings[0] = t;
			} else if (etc.aBoard[t] === 26) {
			  kings[1] = t;
			}
                    }
                }
                //tempboolean = stream.readLine();
                if (stream.readLine() === "true") {
                    etc.bBlackSide = true;
                    flagWhoMoved = 0;
                    merryMessage = chessGame.textString[0][1]; // Black's turn
                } else {
                    etc.bBlackSide = false;
                    flagWhoMoved = 8;
                    merryMessage = chessGame.textString[0][0]; // White's turn
                }
                this.messageStatus.setValue(merryMessage + "'s turn");
                moveno = Math.floor(stream.readLine());
				checkEOF = stream.readLine();
				if (checkEOF) {
					// compatibility with old saved files
					if (checkEOF === "true") {
						wHasMoved = true;
					} else {
						wHasMoved = false;
					}
					if (stream.readLine() === "true") {
						bHasMoved = true;
					} else {
						bHasMoved = false;
					}
					wOldKing = Math.floor(stream.readLine());
					bOldKing = Math.floor(stream.readLine());
					enPassant = stream.readLine();
					if (enPassant !== "" ) {
						enPassant *= 1;
					}
					wRooks = stream.readLine();
					bRooks = stream.readLine();
				}
				checkEOF = stream.readLine();
				if (checkEOF) {
					// compatibility with old saved files
					if (checkEOF === "true") {
						playAsBlack = true;
					} else {
						playAsBlack = false;
					}
				}
                this.puzzleName.setValue("");
                this.puzzleSource.setValue("");
                this.puzzleMoves.setValue("");
                doingPuzzle = false;
				newGame = false;

                stream.close();

                // update board
                this.writePieces();

				// revert button/label to "New Game"
				setSoValue(target.BUTTON_RES, 'text', "New Game");
				this.nonTouch.setValue("[Hold 9] New Game");
				mouseEnter.call(target.BUTTON_RES);
				mouseLeave.call(target.BUTTON_RES);
				
                // reset undo
                currundo = 0;
                this.updateUndo();

                // remove what moved highlights
                this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
                this.selection2.changeLayout(0, 0, uD, 0, 0, uD);
                this.selection3.changeLayout(0, 0, uD, 0, 0, uD);

                // check for checkmate/stalemate
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
                this.getInCheckPieces();
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
            }
        }
        catch (e) {
            this.checkStatus.setValue("Game load failed");
        }
    };

    target.moveCursor = function (dir) {
        if (puzzDlgOpen) {
            this.PUZZLE_DIALOG.moveCursor(dir);
            return;
        }
        switch (dir) {
            case "down":
                cursorY += 75;
                if (cursorY > 595) {
                    cursorY = 70;
                }
                break;
            case "up":
                cursorY -= 75;
                if (cursorY < 70) {
                    cursorY = 595;
                }
                break;
            case "left":
                cursorX -= 75;
                if (cursorX < 0) {
                    cursorX = 525;
                }
                break;
            case "right":
                cursorX += 75;
                if (cursorX > 525) {
                    cursorX = 0;
                }
                break;
        }
        this.gridCursor.changeLayout(cursorX, 75, uD, cursorY, 75, uD);
    };

    target.cursorClick = function () {
        var x, y, iPosition;
        if (puzzDlgOpen) {
            this.PUZZLE_DIALOG.doCenterF();
            return;
        }
        x = cursorX / 75; // find column
        y = (cursorY - 70) / 75; // find row
		if (playAsBlack) {
			iPosition = 121 - ((y + 2) * 10 + 2 + x);
		} else {
			iPosition = (y + 2) * 10 + 2 + x;
		}
        //this.debugOut("n="+n+", iPosition="+iPosition);
        this.makeSelection(iPosition);
        return;
    };

    target.digitF = function (key) {
        if ((key > 0) && (key < 9)) {
            cursorX = (key - 1) * 75;
            this.gridCursor.changeLayout(cursorX, 75, uD, cursorY, 75, uD);
        }
        if (key === 9) {
            etc.nPromotion = (etc.nPromotion + 1) % 4;
            this.nonTouch5.setValue("[9] Pawn promotion to: " + chessGame.textString[1][etc.nPromotion]);
            return;
        }
        if (key === 0) {
            // This indicates the AI level. It can be 1 (2 seconds),2 (10 seconds) or 3 (30 seconds).
            level++;
            if (level === 4) {
                level = 1;
                automode = !automode;
            }
            merryMessage = " (";
            merryMessage += automode ? chessGame.textString[3][0] : chessGame.textString[3][1];
            merryMessage += ")";
            this.nonTouch6.setValue(chessGame.textString[2][0] + chessGame.textString[2][level] + merryMessage);
        }
        return;
    };

    target.doHold9 = function () {
        var currentLabel;
		// initiate new game
		currentLabel = getSoValue(target.BUTTON_RES, 'text');
		if (currentLabel === "As Black") {
			playAsBlack = true;
			setSoValue(target.BUTTON_RES, 'text', "New Game");
			this.nonTouch.setValue("[Hold 9] New Game");
			mouseEnter.call(target.BUTTON_RES);
			mouseLeave.call(target.BUTTON_RES);
		} else {
			playAsBlack = false;
			setSoValue(target.BUTTON_RES, 'text', "As Black");
			this.nonTouch.setValue("[Hold 9] As Black");
			mouseEnter.call(target.BUTTON_RES);
			mouseLeave.call(target.BUTTON_RES);
		}
        this.resetBoard();
        bGameNotOver = true;
        this.messageStatus.setValue(chessGame.textString[0][0] + "'s turn");
        this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection2.changeLayout(0, 0, uD, 0, 0, uD);
        this.selection3.changeLayout(0, 0, uD, 0, 0, uD);
		if (hasNumericButtons) {
			cursorX = 0;
			cursorY = 520;
			this.gridCursor.changeLayout(cursorX, 75, uD, cursorY, 75, uD);
		}
        etc.bBlackSide = false;

        this.writePieces();

        // initial undo
        currundo = 0;
        this.updateUndo();
		
		if ((automode) && (playAsBlack)) {
			FskUI.Window.update.call(kbook.model.container.getWindow());
			this.doSize();
		}
        return;
    };

    target.doHold0 = function () {
        kbook.autoRunRoot.exitIf(kbook.model);
        return;
    };

    target.doHold1 = function () {
        this.PUZZLE_DIALOG.open();
        return;
    };

    target.doPrev = function () {
        if (isNT) {
            this.moveCursor("left");
            return;
        }
        // This indicates the AI level. It can be 1 (2 seconds),2 (10 seconds) or 3 (30 seconds).
        level++;
        if (level === 4) {
            level = 1;
            automode = !automode;
        }
        merryMessage = " (Auto ";
        merryMessage += automode ? chessGame.textString[3][0] : chessGame.textString[3][1];
        merryMessage += ")";
        this.touchButtons1.setValue(chessGame.textString[2][level] + merryMessage);
        return;
    };

    target.doNext = function () {
        if (isNT) {
            this.moveCursor("right");
            return;
        }
        etc.nPromotion = (etc.nPromotion + 1) % 4;
        this.sometext2.setValue(chessGame.textString[1][etc.nPromotion]);
        return;
    };

	// AI functions
    target.doSize = function () {
        //unused var x, y, z;
		//this.debugOut("doSize");
        if (!bGameNotOver) {
            return;
        }

        // call AI routine to calculate move for whichever player is currently supposed to be making a move
        if (this.findMove()) {
			// revert button/label to "New Game"
			setSoValue(target.BUTTON_RES, 'text', "New Game");
			this.nonTouch.setValue("[Hold 9] New Game");
			mouseEnter.call(target.BUTTON_RES);
			mouseLeave.call(target.BUTTON_RES);
				
			// check for checkmate / stalemate
			this.getInCheckPieces();
			if (bGameNotOver) {
				flagWhoMoved ^= 8;
				etc.bBlackSide = !etc.bBlackSide;
				this.getInCheckPieces();
				flagWhoMoved ^= 8;
				etc.bBlackSide = !etc.bBlackSide;
			}

			// may need to do an automove if game not over and in automode
			if ((bGameNotOver) && (automode) && (((etc.bBlackSide) && (!playAsBlack)) || ((!etc.bBlackSide) && (playAsBlack)))) {
				FskUI.Window.update.call(kbook.model.container.getWindow());
				this.doSize();
			}
        } else {
            // couldn't find a move, so check for checkmate / stalemate
            this.getInCheckPieces();
            if (bGameNotOver) {
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
                this.getInCheckPieces();
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
            }
            if (bGameNotOver) {
				// output AI failure message
				this.checkStatus.setValue("AI failed. Sorry!");
				return;
            }
        }
        return;
    };
	
    target.findMove = function () {
        var noOfMoves, bestmove = [];
		//this.debugOut("findMove");

        //check to see if there is only one possible move available
        noOfMoves = target.findNumberOfMoves();
		//this.debugOut("noOfMoves="+noOfMoves);
		
        if (noOfMoves[0] === 1) {
			bestmove=[noOfMoves[1],noOfMoves[2],noOfMoves[3],noOfMoves[4]];
        } else {
            bestmove = this.callChessEngine();
        }
		
		if (bestmove === null) { return (false); }
		
		return (this.processMove(bestmove));
    };

	target.callChessEngine = function () {
		var inputText, emptyCount, boardSquare, contentSquare, FRUITIN, FRUITOUT, FRUIT, cmd, result, movePos, move, bestmove = [];
		//this.debugOut("callChessEngine");
		
		inputText = inputHeader;
		
		if (newGame) {
			inputText += "position startpos\n";
		} else {
			inputText += "position fen ";
			// convert board to FEN format
			y = 0;
			for (y; y<8; y++) {
				emptyCount = 0;
				x = 0;
				for (x; x<8; x++) {
					boardSquare = (y + 2) * 10 + 2 + x;
					contentSquare = etc.aBoard[boardSquare];
					if (contentSquare === 0) {
						emptyCount++;
					} else {
						if (emptyCount > 0) {
							inputText += emptyCount;
							emptyCount = 0;
						}
						switch (contentSquare) {
							case 17:
								inputText += "p";
								break;
							case 18:
								inputText += "k";
								break;
							case 19:
								inputText += "n";
								break;
							case 20:
								inputText += "b";
								break;
							case 21:
								inputText += "r";
								break;
							case 22:
								inputText += "q";
								break;
							case 25:
								inputText += "P";
								break;
							case 26:
								inputText += "K";
								break;
							case 27:
								inputText += "N";
								break;
							case 28:
								inputText += "B";
								break;
							case 29:
								inputText += "R";
								break;
							case 30:
								inputText += "Q";
								break;
						}
					}
				}
				if (emptyCount > 0) {
					inputText += emptyCount;
				}
				if (y !== 7) { inputText += "/"; }
			}
			
			// add who's turn it is to move
			if (etc.bBlackSide) {
				inputText += " b ";
			} else {
				inputText += " w ";
			}
			
			// add castling info
			if (!wHasMoved) {
				inputText += wRooks;
			}
			if (!bHasMoved) {
				inputText += bRooks;
			}
			if ((wHasMoved) && (bHasMoved)) {
				inputText += "-";
			}
			
			// add en passant info
			if (enPassant !== "") {
				inputText += " ";
				x = (enPassant % 10) - 2;		
				inputText += "abcdefgh".substring(x,x+1);
				/* replaced by 1 line, see above drMerry
				 switch (x) {
					case 0:
						inputText += "a";
						break;
					case 1:
						inputText += "b";
						break;
					case 2:
						inputText += "c";
						break;
					case 3:
						inputText += "d";
						break;
					case 4:
						inputText += "e";
						break;
					case 5:
						inputText += "f";
						break;
					case 6:
						inputText += "g";
						break;
					case 7:
						inputText += "h";
						break;
				}
				*/
				y = Math.floor((enPassant - 20) / 10);
				inputText += (8-y);
				/* replaced  by 1 line see above drMerry 
				 switch (y) {
					case 0:
						inputText += "8";
						break;
					case 1:
						inputText += "7";
						break;
					case 2:
						inputText += "6";
						break;
					case 3:
						inputText += "5";
						break;
					case 4:
						inputText += "4";
						break;
					case 5:
						inputText += "3";
						break;
					case 6:
						inputText += "2";
						break;
					case 7:
						inputText += "1";
						break;
				}
				*/
			} else {
				inputText += " -";
			}
			
			// add half-move number
			inputText += " 0 "; // TODO: Track number of moves since pawn moved or piece taken!
			
			// add fullmove number
			inputText += Math.floor(moveno / 2);
			
			// add previous move
			inputText += "\n";
		}
		
		if (level === 1) {
			inputText += "go movetime 2000\n"; // 2 seconds
		} else if (level === 2) {
			inputText += "go movetime 10000\n"; // 10 seconds
		} else if (level === 3) {
			inputText += "go movetime 30000\n"; // 30 seconds
		}
		
		// delete old output file if it exists
		FRUITOUT = "/tmp/fruit/fruit.out";
		FileSystem.deleteFile(FRUITOUT);
		
		// set up new input file
		FRUITIN = "/tmp/fruit/fruit.in";
		setFileContent(FRUITIN, inputText);
		//this.debugOut("inputText:\n"+inputText);
		
		// Output "processing..." message and update screen
		this.checkStatus.setValue("Thinking...");
		FskUI.Window.update.call(kbook.model.container.getWindow());

		// change to directory where performance.bin should be and call chess engine
		FRUIT = System.applyEnvironment("[prspPath]") + "fruit";
		cmd = "cd " + datPath0 + ";" + FRUIT + " < " + FRUITIN + " > " + FRUITOUT;
		//this.debugOut("cmd="+cmd);
		shellExec(cmd);
		
		// retrieve output file
		result = getFileContent(FRUITOUT, "222");
		if (result !== "222") {
			//this.debugOut("output:\n"+result);
			// scan for best move
			movePos = result.indexOf("bestmove");
			//this.debugOut("movePos="+movePos);
			move = result.substring(movePos + 9, movePos + 14);
			//this.debugOut("move="+move);
		
			switch (move.substring(0, 1)) {
				case 'a':
					bestmove[0] = 0;
					break;
				case 'b':
					bestmove[0] = 1;
					break;
				case 'c':
					bestmove[0] = 2;
					break;
				case 'd':
					bestmove[0] = 3;
					break;
				case 'e':
					bestmove[0] = 4;
					break;
				case 'f':
					bestmove[0] = 5;
					break;
				case 'g':
					bestmove[0] = 6;
					break;
				case 'h':
					bestmove[0] = 7;
					break;
			}
			
			switch (move.substring(1, 2)) {
				case '1':
					bestmove[1] = 7;
					break;
				case '2':
					bestmove[1] = 6;
					break;
				case '3':
					bestmove[1] = 5;
					break;
				case '4':
					bestmove[1] = 4;
					break;
				case '5':
					bestmove[1] = 3;
					break;
				case '6':
					bestmove[1] = 2;
					break;
				case '7':
					bestmove[1] = 1;
					break;
				case '8':
					bestmove[1] = 0;
					break;
			}
			
			switch (move.substring(2, 3)) {
				case 'a':
					bestmove[2] = 0;
					break;
				case 'b':
					bestmove[2] = 1;
					break;
				case 'c':
					bestmove[2] = 2;
					break;
				case 'd':
					bestmove[2] = 3;
					break;
				case 'e':
					bestmove[2] = 4;
					break;
				case 'f':
					bestmove[2] = 5;
					break;
				case 'g':
					bestmove[2] = 6;
					break;
				case 'h':
					bestmove[2] = 7;
					break;
			}
			
			switch (move.substring(3, 4)) {
				case '1':
					bestmove[3] = 7;
					break;
				case '2':
					bestmove[3] = 6;
					break;
				case '3':
					bestmove[3] = 5;
					break;
				case '4':
					bestmove[3] = 4;
					break;
				case '5':
					bestmove[3] = 3;
					break;
				case '6':
					bestmove[3] = 2;
					break;
				case '7':
					bestmove[3] = 1;
					break;
				case '8':
					bestmove[3] = 0;
					break;
			}
			
			switch (move.substring(4, 5)) {
				case 'q':
					bestmove[4] = 0;
					break;
				case 'r':
					bestmove[4] = 1;
					break;
				case 'b':
					bestmove[4] = 2;
					break;
				case 'n':
					bestmove[4] = 3;
					break;
				default:
					break;
			}
		}
		
		return (bestmove);
	};
	
	target.processMove = function (bestmove) {
		var nFrstFocus, nSquareId, nDiffX, nDiffY, nWay, nPiece, nPieceType, xRook, ourRook, flagPcColor;
		//this.debugOut("processMove");
		//this.debugOut("From: x="+bestmove[0]+", y="+bestmove[1]);
		//this.debugOut("To: x="+bestmove[2]+", y="+bestmove[3]);
		
		// convert x,y to board position
		nFrstFocus = (bestmove[1] + 2) * 10 + 2 + bestmove[0];
		if (etc.aBoard[nFrstFocus] === 0) {
			return (false);
		}
		nSquareId = (bestmove[3] + 2) * 10 + 2 + bestmove[2];
		fourBtsLastPc = etc.aBoard[nFrstFocus] & 15;

		// check for pawn promotion
		if (etc.bBlackSide) {
			if ((fourBtsLastPc === 1) && (nSquareId >= 90)) {
				fourBtsLastPc = 6 - bestmove[4];
			}
		} else {
			if ((fourBtsLastPc === 9) && (nSquareId <= 29)) {
				fourBtsLastPc = 14 - bestmove[4];
			}
		}

		// update move
		etc.aBoard[nFrstFocus] = 0;
		etc.aBoard[nSquareId] = fourBtsLastPc + 16;
		lastStart = nFrstFocus;
		lastEnd = nSquareId;

		// need to handle castling
		nPiece = etc.aBoard[nSquareId];
		nPieceType = nPiece & 7;
		if (nPieceType === 2) {
			if (etc.bBlackSide) {
				bHasMoved = true;
			} else {
				wHasMoved = true;
			}
		}
		nDiffX = bestmove[2] - bestmove[0];
		nDiffY = bestmove[3] - bestmove[1];
		xRook = 30 - nDiffX >> 2 & 7;
		ourRook = etc.lookAt(xRook, bestmove[3]);
		if ((nPieceType === 2) && (nDiffX + 2 | 4) === 4 && nDiffY === 0 && ourRook > 0 && Boolean(ourRook & 16)) {
			etc.aBoard[bestmove[3] * 10 + xRook + 22] = 0;
			if (bestmove[2] === 6) {
				etc.aBoard[nSquareId - 1] = ourRook;
			} else if (bestmove[2] === 2) {
				etc.aBoard[nSquareId + 1] = ourRook;
			}
		}

		// need to disable possibility of castling if rooks moved
		if (etc.bBlackSide) {
			if ((nPieceType === 5) && (nFrstFocus === 22) && (bRooks.indexOf("q")>=0)) {
				if (bRooks === "kq") {
					bRooks = "k";
				} else if (bRooks === "q") {
					bRooks = "";
				}
			}
			if ((nPieceType === 5) && (nFrstFocus === 29) && (bRooks.indexOf("k")>=0)) {
				if (bRooks === "kq") {
					bRooks = "q";
				} else if (bRooks === "k") {
					bRooks = "";
				}
			}
		} else {		
			if ((nPieceType === 5) && (nFrstFocus === 92) && (wRooks.indexOf("Q")>=0)) {
				if (wRooks === "KQ") {
					wRooks = "K";
				} else if (wRooks === "Q") {
					wRooks = "";
				}
			}
			if ((nPieceType === 5) && (nFrstFocus === 99) && (wRooks.indexOf("K")>=0)) {
				if (wRooks === "KQ") {
					wRooks = "Q";
				} else if (wRooks === "K") {
					wRooks = "";
				}
			}
		}
				
		// need to handle en passant
		flagPcColor = nPiece & 8;
		nWay = 4 - flagPcColor >> 2;
		if (etc.bBlackSide) {
			if ((nPieceType === 1) && (bestmove[1] === 7 + nWay >> 1) && (enPassant === nSquareId)) {
				// remove pawn
				etc.aBoard[nSquareId - 10] = 0;
			}
			if ((nPieceType === 1) && (nDiffY === 2)) {
				enPassant = nSquareId - 10;
			} else {
				enPassant = "";
			}
		} else {
			if ((nPieceType === 1) && (bestmove[1] === 7 + nWay >> 1) && (enPassant === nSquareId)) {
				etc.aBoard[nSquareId + 10] = 0;
			}
			if ((nPieceType === 1) && (nDiffY === -2)) {
				enPassant = nSquareId + 10;
			} else {
				enPassant = "";
			}
		}

		// update location of king when it is moved
		if (nPieceType === 2) {
			kings[flagPcColor >> 3] = nSquareId;
		}
		
		// update screen
		newGame = false;
		this.writePieces();
		this.updateUndo();
		
			
        // get stuff ready for next move
        moveno++;
        if (doingPuzzle) {
            // update number of moves for puzzle
            puzzleMoves = Math.floor((moveno + 1) / 2);
            this.puzzleMoves.setValue(puzzleMoves);
        }

        // the move is done
        //so give the other side a turn.
        etc.bBlackSide = !etc.bBlackSide;
        flagWhoMoved ^= 8;
        merryMessage = (etc.bBlackSide) ? chessGame.textString[0][1] : chessGame.textString[0][0];
        this.messageStatus.setValue(merryMessage + "'s turn");

		return (true);
	};

    // Puzzle pop-up panel stuff
    target.PUZZLE_DIALOG.open = function () {
        if (isNT) {
            target.PUZZLE_DIALOG.checkmateIn_2.enable(true);
            custSel = 0;
            target.ntHandlePuzzDlg();
        }
        puzzDlgOpen = true;
        target.PUZZLE_DIALOG.show(true);
    };

    target.ntHandlePuzzDlg = function () {
      switch (custSel) {
	case 0:
            target.PUZZLE_DIALOG.checkmateIn_2.enable(true);
            target.PUZZLE_DIALOG.checkmateIn_3.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_4.enable(false);
            mouseLeave.call(target.PUZZLE_DIALOG.btn_Ok);
	    break;
	case 1:
            target.PUZZLE_DIALOG.checkmateIn_2.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_3.enable(true);
            target.PUZZLE_DIALOG.checkmateIn_4.enable(false);
            mouseLeave.call(target.PUZZLE_DIALOG.btn_Ok);
	    break;
	case 2:
            target.PUZZLE_DIALOG.checkmateIn_2.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_3.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_4.enable(true);
            mouseLeave.call(target.PUZZLE_DIALOG.btn_Ok);
	    break;
	case 3:
            target.PUZZLE_DIALOG.checkmateIn_2.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_3.enable(false);
            target.PUZZLE_DIALOG.checkmateIn_4.enable(false);
            mouseLeave.call(target.PUZZLE_DIALOG.btn_Cancel);
            mouseEnter.call(target.PUZZLE_DIALOG.btn_Ok);
	    break;
	case 4:
            mouseLeave.call(target.PUZZLE_DIALOG.btn_Ok);
            mouseEnter.call(target.PUZZLE_DIALOG.btn_Cancel);
	    break;
        }
    };

    target.PUZZLE_DIALOG.moveCursor = function (direction) {
        switch (direction) {
            case "up":
                if (custSel > 0) {
                    custSel--;
                    target.ntHandlePuzzDlg();
                }
                break;
            case "down":
                if (custSel < 4) {
                    custSel++;
                    target.ntHandlePuzzDlg();
                }
                break;
            case "left":
                if (custSel === 0 || custSel === 1 || custSel === 2) { target.PUZZLE_DIALOG["checkmateIn_" + (custSel + 2) + "-"].click(); }
                break;
            case "right":
                if (custSel === 0 || custSel === 1 || custSel === 2) { target.PUZZLE_DIALOG["checkmateIn_" + (custSel + 2) + "+"].click(); }
                break;
        }
    };

    target.PUZZLE_DIALOG.doCenterF = function () {
        if (custSel === 0 || custSel === 1 || custSel === 2) { target.setVariable("puzzle_selected", "" + (custSel + 2)); }
        else if (custSel === 3) { target.PUZZLE_DIALOG.btn_Ok.click(); }
        else if (custSel === 4) { target.PUZZLE_DIALOG.btn_Cancel.click(); }
    };

    target.PUZZLE_DIALOG.doPlusMinus = function (sender) {
        var senderID, cMateIn2, cMateIn3, cMateIn4, step;
        senderID = getSoValue(sender, "id");
        step = (senderID.lastIndexOf("+") !== -1) ? 1 : -1;
        senderID = senderID.slice(0, senderID.length - 1);
        cMateIn2 = parseInt(target.getVariable("checkmate_2"), 10);
        cMateIn3 = parseInt(target.getVariable("checkmate_3"), 10);
        cMateIn4 = parseInt(target.getVariable("checkmate_4"), 10);
        //this.debugOut( "senderID=" + senderID + ", step=" + step + ", cMateIn2=" + cMateIn2 + ", cMateIn3=" + cMateIn3 + ", cMateIn4=" + cMateIn4);
	
        switch (senderID) {
            case "checkmateIn_2":
                if ((cMateIn2 <= (maxMateIn2 - step)) && (cMateIn2 > (-1 * step))) {
                    cMateIn2 = cMateIn2 + step;
                }
                this.container.setVariable("checkmate_2", cMateIn2);
                break;
            case "checkmateIn_3":
                if ((cMateIn3 <= (maxMateIn3 - step)) && (cMateIn3 > (-1 * step))) {
                    cMateIn3 = cMateIn3 + step;
                }
                this.container.setVariable("checkmate_3", cMateIn3);
                break;
            case "checkmateIn_4":
                if ((cMateIn4 <= (maxMateIn4 - step)) && (cMateIn4 > (-1 * step))) {
                    cMateIn4 = cMateIn4 + step;
                }
                this.container.setVariable("checkmate_4", cMateIn4);
                break;
        }
    };

    target.PUZZLE_DIALOG.setPuzzleType = function (t) {
      //TODO t unused
		/*target.debugOut(t);
		if ( t == "2" || t == "3" || t == "4" )
		{
		target.setVariable("puzzle_selected",t);
		}
		else {
		t = target.getVariable("puzzle_selected");
		}*/
        return;
    };

    target.closeDlg = function () {
        puzzDlgOpen = false;
        return;
    };

    target.loadPuzzle = function () {
        puzzDlgOpen = false;
		newGame = false;
        var t = target.getVariable("puzzle_selected"),
        //target.debugOut(t);
        cMateIn2 = parseInt(target.getVariable("checkmate_2"), 10),
        cMateIn3 = parseInt(target.getVariable("checkmate_3"), 10),
        cMateIn4 = parseInt(target.getVariable("checkmate_4"), 10),
        puzzleToLoad, fileToLoad,
        puzzleName, puzzleSource, stream,
        puzzleData, inpLine, numpuzzle,
        dataItemNum, tempboolean, tempnum;

        if (t === "2") {
            fileToLoad = puzPath + "mate_in_two_moves.dat";
            puzzleToLoad = parseInt(cMateIn2, 10);
        }
        if (t === "3") {
            fileToLoad = puzPath + "mate_in_three_moves.dat";
            puzzleToLoad = parseInt(cMateIn3, 10);
        }
        if (t === "4") {
            fileToLoad = puzPath + "mate_in_four_moves.dat";
            puzzleToLoad = parseInt(cMateIn4, 10);
        }
        //this.debugOut("load puzzle "+fileToLoad+": "+puzzleToLoad);

        // save current puzzle numbers to puzDatPath
        try {
            if (FileSystem.getFileInfo(puzDatPath)) { FileSystem.deleteFile(puzDatPath); }
            stream = new Stream.File(puzDatPath, 1);
            stream.writeLine(cMateIn2);
            stream.writeLine(cMateIn3);
            stream.writeLine(cMateIn4);
            stream.close();
        } catch (e) { }

        // load puzzle
        try {
            if (FileSystem.getFileInfo(fileToLoad)) {
                stream = new Stream.File(fileToLoad);
                puzzleData = [];
                numpuzzle = 1;
                for (numpuzzle; numpuzzle <= puzzleToLoad; numpuzzle++) {
                    // read through puzzle file until you come to the desired puzzle
                    inpLine = stream.readLine();
                }

                stream.close();

                puzzleData = inpLine.split(";");
                dataItemNum = 0;

                // load board from save file
                t = 22;
                for (t; t <= 99; t++) {
                    if (t % 10 > 1) {
                        tempnum = puzzleData[dataItemNum];
                        dataItemNum++;
                        etc.aBoard[t] = Math.floor(tempnum);
                        // convert string to integer
                        if (etc.aBoard[t] === 18) { 
			  kings[0] = t;
			} else if (etc.aBoard[t] === 26) {
			  kings[1] = t;
			}
                    }
                }
                tempboolean = puzzleData[dataItemNum];
                dataItemNum++;
                if (tempboolean === "true") {
                    etc.bBlackSide = true;
                    flagWhoMoved = 0;
                    merryMessage = chessGame.textString[0][1];
                } else {
                    etc.bBlackSide = false;
                    flagWhoMoved = 8;
                    merryMessage = chessGame.textString[0][0];
                }
                this.messageStatus.setValue(merryMessage + "'s turn");
                moveno = puzzleData[dataItemNum];
                dataItemNum++;

                // load extra information
                puzzleName = puzzleData[dataItemNum];
                dataItemNum++;
                puzzleSource = puzzleData[dataItemNum];
                dataItemNum++;
                this.puzzleName.setValue(puzzleName);
                this.puzzleSource.setValue(puzzleSource);
                puzzleMoves = 0;
                doingPuzzle = true;
                this.puzzleMoves.setValue(puzzleMoves);

                // update board
                this.writePieces();

				// revert button/label to "New Game"
				setSoValue(target.BUTTON_RES, 'text', "New Game");
				this.nonTouch.setValue("[Hold 9] New Game");
				mouseEnter.call(target.BUTTON_RES);
				mouseLeave.call(target.BUTTON_RES);
				
				// all puzzles player plays as white
				playAsBlack = false;
				
                // reset undo
                currundo = 0;
                this.updateUndo();

                // remove what moved highlights
                this.selection1.changeLayout(0, 0, uD, 0, 0, uD);
                this.selection2.changeLayout(0, 0, uD, 0, 0, uD);
                this.selection3.changeLayout(0, 0, uD, 0, 0, uD);

                // check for checkmate/stalemate
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
                this.getInCheckPieces();
                flagWhoMoved ^= 8;
                etc.bBlackSide = !etc.bBlackSide;
            }
        } catch (err) {
            this.checkStatus.setValue("Puzzle load failed");
        }
        return;
    };
};
tmp();
tmp = undefined;