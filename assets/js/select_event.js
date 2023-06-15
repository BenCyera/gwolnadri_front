window.onload = async function EventGetTime(event_id) {
    let urlParams = new URLSearchParams(window.location.search);
    event_id = urlParams.get('event_id');

    const get_time = await fetch(`${backend_base_url}/events/${event_id}`, {
    })

    if (get_time.status == 200) {
        const getTime_json = await get_time.json()

        const timeSlots = getTime_json.time_slots
        for(i in timeSlots){
            console.log(timeSlots[i]);

            let innerTime = timeSlots[i].split(':')[0]
            console.log(innerTime)

            document.getElementById(`${innerTime}`).disabled = false;
        };
    } else if (get_time.status == 404) {
        document.getElementById('9').disabled = false;
        document.getElementById('10').disabled = false;
        document.getElementById('11').disabled = false;
        document.getElementById('12').disabled = false;
        document.getElementById('13').disabled = false;
        document.getElementById('14').disabled = false;
        document.getElementById('15').disabled = false;
        document.getElementById('16').disabled = false;
        document.getElementById('17').disabled = false;
        document.getElementById('18').disabled = false;
        document.getElementById('select').setAttribute('onClick','handleSelectHanbok()');
    } else {
        alert("잘못된 상품 정보입니다")
        window.location.href = `${frontend_base_url}`
    }
}

async function handleSelectEvent(event_id) {
    const urlParams = new URLSearchParams(window.location.search);
    event_id = urlParams.get('event_id');

    const date = document.getElementById('rsrvt_date').value;
    const time = document.querySelector('input[type=radio][name=time]:checked').value;
    let quantity = document.getElementById('quantity').value;

    let int_quantity = Number(quantity)

    first = date.split('-')
    middle = time.split(':')
    order_id = first[2]+middle[1]+first[0]+middle[0]+first[1]

    const response = await fetch(`${backend_base_url}/events/${event_id}`, {
    })

    if (response.status == 200) {
        const response_json = await response.json()
        console.log(response_json)

        const item = response_json.title
        const order_stf_id = response_json.author
        const original_price = response_json.money

        const price = original_price * int_quantity
        const vat = price * 0.1
        const total = price + vat

        const kakao_pay = await fetch("https://kapi.kakao.com/v1/payment/ready", {
            headers:{
                "Authorization": "KakaoAK c852f123396eb62c459e2f8c0ddf1a30",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: 'POST',
            body: new URLSearchParams({
                "cid": "TC0ONETIME",
                "partner_order_id": order_id,
                "partner_user_id": order_stf_id,
                "item_name": item,
                "quantity": int_quantity,
                "total_amount": total,
                "vat_amount": vat,
                "tax_free_amount": 0,
                "approval_url": `${frontend_base_url}/complete.html`,
                "fail_url": `${frontend_base_url}`,
                "cancel_url": `${frontend_base_url}`
            })
        });

        console.log(kakao_pay)
        
        if (kakao_pay.status == 200) {
            alert("결제요청 완료")

            const kakao_json = await kakao_pay.json()
            console.log(kakao_json)

            const tid = kakao_json.tid
            const created_at = kakao_json.created_at
            const next_url_m = kakao_json.next_redirect_mobile_url
            const next_url_p = kakao_json.next_redirect_pc_url
            
            setCookie("tid", tid, 2);
    
            const send = await fetch(`${backend_base_url}/api/v1/stores/payment/${payload_parse.user_id}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'content-type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    "tid": tid,
                    "type":"event",
                    "created_at": created_at,
                    "partner_order_id": order_id,
                    "partner_user_id": order_stf_id,
                    "item_name": item,
                    "quantity": int_quantity,
                    "total_amount": total,
                    "vat_amount": vat,
                    "rsrvt_date": date,
                    "rsrvt_time": time
                })
            })
            console.log(send)

            if (send.status == 200) {
                alert("db 저장완료")
                window.location.href = next_url_p
            } else {
                alert("db 저장실패",send.status)
                // window.location.href = `${frontend_base_url}`
            }

        } else {
            console.log(kakao_pay.status)
            alert("결제요청 실패",kakao_pay.status)
        }

    } else {
        // console.log(response_json)
        alert(response.status,"잘못된 상품 정보입니다")
        // window.location.href = `${frontend_base_url}`
    }

}