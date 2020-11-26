const TempOfSubPocket = require('../models/tempOfSubPocket');


exports.tempPocket = async(groupOrRoomId, total, hotelPocket, restPocket) => {
    console.log(groupOrRoomId, total, hotelPocket, restPocket);
    const temp = new TempOfSubPocket()
    temp.groupOrRoomId = groupOrRoomId;
    temp.total = total;
    temp.hotelPocket = hotelPocket;
    temp.restPocket = restPocket;
    const tempSaved = await temp.save();
    if(tempSaved.status === 'failure'){
        throw new APIError({
            message: 'saveTempPocket Rejected',
            status: httpStatus.BAD_GATEWAY,
        });
    }
    const response = { tempSaved: temp.transform() }
    return response;
}