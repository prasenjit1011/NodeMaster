import sgMail from '@sendgrid/mail';
import type { Request, Response, NextFunction } from 'express';

export const sendMail = (req: Request, res: Response, _next: NextFunction) => {

  const apikey = process.env.SENDGRID_API_KEY;
  if (!apikey) {
    return res.end(JSON.stringify({"status":0, "msg":"API key not set."}));
  }
  let userName      = req.body?.userName;
  let mobileNumber  = req.body?.mobileNumber;
  let emailId       = req.body?.emailId;
  let userMsg       = req.body?.userMsg;
  let msgStr        = '';

  msgStr += '<p>Name : '+userName+'</p>';
  msgStr += '<p>Mobile : '+mobileNumber+'</p>';
  msgStr += '<p>Email Id : '+emailId+'</p>';
  msgStr += '<p>Msg : '+userMsg+'</p>';


  sgMail.setApiKey(apikey)
  const msg = {
    to: {
      name : 'Prasenjit',
      email : 'prasenjit.aluni@gmail.com'
    },
    from: {
      name : 'Cluck',
      email : 'prasenjit10112@gmail.com'

    },
    subject: 'New msg come from Cluck '+Date(),
    text: 'Email Id : '+emailId,
    html: msgStr,
  }


  return sgMail
    .send(msg)
    .then(() => {
      console.log('\n\n-------------Msg----------------------------\n\n')
      console.log(msg);
      return res.end(JSON.stringify({"status":1,"msg":"Email sent successfully"}));
    })
    .catch((error) => {
      console.log('\n\n------Error-----------\n\n')
      console.error(error);
      return res.end(JSON.stringify({"status":0, "msg":"Mail not sent."}));
    });

}